import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketServerRegistry } from '../../services/socket-server.registry';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { RoomNames } from '../../../../common/utils/room-names';
import { SocketEvents, SpaceTypes } from '../../../../common/types/enums';
import { UsersRepository } from '../../../../common/modules/iam/users/users.repository';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';

const MAX_WATCH_USERS = 300;

@WebSocketGateway({ cors: true })
export class PresenceGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private sessionConnections = new Map<string, Set<string>>();
  private userSessions = new Map<string, Set<string>>();
  private userWatchers = new Map<string, Set<string>>();

  constructor(
    private readonly registry: SocketServerRegistry,
    private readonly socketEmitter: SocketEmitterService,
    private readonly usersRepository: UsersRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  afterInit(server: Server) {
    this.registry.setServer(server);
  }

  private getSessionKey(userId: string, sessionId: string): string {
    return `${userId}:${sessionId}`;
  }

  @SubscribeMessage(SocketEvents.PRESENCE_SUBSCRIBE)
  async handlePresenceSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { userIds: string[] },
  ) {
    const currentUserId = client.data.userId as string;

    if (!currentUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    const targetUserIds = dto?.userIds ?? [];
    const uniqueUserIds = [...new Set(targetUserIds)];
    const validUserIds = uniqueUserIds.filter((id) => id !== currentUserId);

    if (validUserIds.length === 0) {
      return {
        success: true,
        onlineUserIds: [],
        lastSeenMap: {},
        skippedUserIds: [],
      };
    }

    const watchedUsers = client.data.watchedUsers ?? new Set<string>();
    const remainingCapacity = MAX_WATCH_USERS - watchedUsers.size;

    // Accept as many as fit instead of rejecting the whole batch. The
    // frontend drains a shared queue and treats "already sent" (refcount
    // incremented) as done regardless of the ack result - so an all-or-
    // nothing rejection here permanently strands whichever ids land in an
    // over-capacity batch: their refcount stays > 0 on the client, so no
    // future subscribeToUsers() call will ever retry them.
    const acceptedUserIds = validUserIds.slice(
      0,
      Math.max(0, remainingCapacity),
    );
    const skippedUserIds = validUserIds.slice(acceptedUserIds.length);

    if (acceptedUserIds.length === 0) {
      return {
        success: false,
        error: `Cannot watch more than ${MAX_WATCH_USERS} users at once`,
        skippedUserIds: validUserIds,
      };
    }

    const onlineUserIds: string[] = [];
    const lastSeenMap: Record<string, string | null> = {};
    const offlineIds: string[] = [];

    for (const userId of acceptedUserIds) {
      const sessions = this.userSessions.get(userId);
      const isOnline = sessions && sessions.size > 0;

      if (isOnline) {
        onlineUserIds.push(userId);
        lastSeenMap[userId] = null;
      } else {
        offlineIds.push(userId);
        lastSeenMap[userId] = null;
      }
    }

    if (offlineIds.length > 0) {
      const users = await this.usersRepository.findMany({
        query: { _id: { $in: offlineIds } },
        select: '_id lastSeenAt',
      });

      users.forEach((u: any) => {
        lastSeenMap[u._id.toString()] = u.lastSeenAt
          ? new Date(u.lastSeenAt).toISOString()
          : null;
      });
    }

    for (const targetUserId of acceptedUserIds) {
      const watchers = this.userWatchers.get(targetUserId) ?? new Set();
      watchers.add(currentUserId);
      this.userWatchers.set(targetUserId, watchers);

      client.join(RoomNames.presenceWatch(targetUserId));
      watchedUsers.add(targetUserId);
    }

    client.data.watchedUsers = watchedUsers;

    if (skippedUserIds.length > 0) {
      console.warn(
        `⚠️ User ${currentUserId} hit the ${MAX_WATCH_USERS}-user watch cap - ` +
          `accepted ${acceptedUserIds.length}, skipped ${skippedUserIds.length}`,
      );
    }

    console.log(
      `👀 User ${currentUserId} subscribed to ${acceptedUserIds.length} users ` +
        `(total watching: ${watchedUsers.size})`,
    );

    return {
      success: true,
      onlineUserIds,
      lastSeenMap,
      // Tell the client which ids did NOT get subscribed, so it can roll
      // back their refcount instead of treating them as watched forever.
      skippedUserIds,
    };
  }

  @SubscribeMessage(SocketEvents.PRESENCE_UNSUBSCRIBE)
  async handlePresenceUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { userIds?: string[] },
  ) {
    const currentUserId = client.data.userId as string;

    if (!currentUserId) {
      return { success: false, error: 'Unauthorized' };
    }

    const targetUserIds = dto?.userIds ?? [];
    const watchedUsers = client.data.watchedUsers ?? new Set<string>();

    const userIdsToUnsubscribe: string[] =
      targetUserIds.length > 0 ? targetUserIds : Array.from(watchedUsers);

    if (userIdsToUnsubscribe.length === 0) {
      return { success: true };
    }

    for (const targetUserId of userIdsToUnsubscribe) {
      const watchers = this.userWatchers.get(targetUserId);
      if (watchers) {
        watchers.delete(currentUserId);
        if (watchers.size === 0) {
          this.userWatchers.delete(targetUserId);
        }
      }

      client.leave(RoomNames.presenceWatch(targetUserId));
      watchedUsers.delete(targetUserId);
    }

    client.data.watchedUsers = watchedUsers;

    console.log(
      `👀 User ${currentUserId} unsubscribed from ${userIdsToUnsubscribe.length} users ` +
        `(remaining: ${watchedUsers.size})`,
    );

    return { success: true };
  }

  private broadcastToWatchers(
    userId: string,
    event: SocketEvents,
    payload: any,
  ) {
    const watchers = this.userWatchers.get(userId);
    if (!watchers || watchers.size === 0) return;

    const watcherArray = Array.from(watchers);
    watcherArray.forEach((watcherId) => {
      this.socketEmitter.emitToUser(watcherId, event, payload);
    });

    if (watcherArray.length > 0) {
      console.log(
        `📡 Broadcasted ${event} to ${watcherArray.length} watchers of user ${userId}`,
      );
    }
  }

  private async joinUserToSpaceRooms(
    client: Socket,
    userId: string,
  ): Promise<string[]> {
    const memberships = await this.membersRepository.findMany({
      query: { user: userId, isDeleted: false },
      select: 'space',
    });

    const spaceIds: string[] = [];

    memberships.forEach((m: any) => {
      const space = m.space;
      if (!space) return;

      const spaceId = space._id.toString();
      spaceIds.push(spaceId);

      client.join(RoomNames.space(spaceId));

      if (space.parentSpace) {
        client.join(RoomNames.community(space.parentSpace.toString()));
      }

      if (space.type === SpaceTypes.COMMUNITY) {
        client.join(RoomNames.community(spaceId));
      }
    });

    return spaceIds;
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string;
    const sessionId = client.data.sessionId as string;

    if (!userId || !sessionId) {
      client.disconnect();
      return;
    }

    const sessionKey = this.getSessionKey(userId, sessionId);
    console.log(`🟢 User connected: ${userId}, session: ${sessionId}`);

    client.join(RoomNames.user(userId));
    client.join(RoomNames.session(sessionKey));

    const sessionSockets =
      this.sessionConnections.get(sessionKey) ?? new Set<string>();
    const isFirstConnectionInSession = sessionSockets.size === 0;
    sessionSockets.add(client.id);
    this.sessionConnections.set(sessionKey, sessionSockets);

    const userSessionSet = this.userSessions.get(userId) ?? new Set<string>();
    const isNewSession = !userSessionSet.has(sessionKey);
    userSessionSet.add(sessionKey);
    this.userSessions.set(userId, userSessionSet);

    const spaceIds = await this.joinUserToSpaceRooms(client, userId);

    if (!this.sessionConnections.get(sessionKey)?.has(client.id)) {
      return;
    }

    client.data.spaceIds = spaceIds;
    client.data.sessionKey = sessionKey;

    if (isFirstConnectionInSession) {
      if (isNewSession) {
        console.log(`🟢 First session for user ${userId}, broadcasting ONLINE`);

        this.broadcastToWatchers(userId, SocketEvents.PRESENCE_USER_ONLINE, {
          userId,
          sessionId,
          isOnline: true,
        });

        spaceIds.forEach((spaceId) => {
          this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_ONLINE, {
            userId,
            sessionId,
            spaceId,
          });
        });

        this.socketEmitter.emitToUser(userId, SocketEvents.USER_ONLINE, {
          userId,
          sessionId,
          isSelf: true,
        });
      } else {
        console.log(
          `🟢 New session for user ${userId}, notifying only the user`,
        );

        this.socketEmitter.emitToUser(userId, SocketEvents.USER_ONLINE, {
          userId,
          sessionId,
          isSelf: true,
        });
      }
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string;
    const sessionKey = client.data.sessionKey as string;

    if (!userId || !sessionKey) {
      console.log('⚠️ Disconnect: missing userId or sessionKey');
      return;
    }

    console.log(`🔴 User disconnected: ${userId}, session: ${sessionKey}`);

    const spaceIds = (client.data.spaceIds as string[]) ?? [];
    const sessionSockets = this.sessionConnections.get(sessionKey);

    if (!sessionSockets) {
      console.log(`⚠️ No session found for ${sessionKey}`);
      return;
    }

    sessionSockets.delete(client.id);

    if (sessionSockets.size > 0) {
      console.log(
        `📊 Session ${sessionKey} has ${sessionSockets.size} remaining connections`,
      );
      return;
    }

    this.sessionConnections.delete(sessionKey);

    const userSessionSet = this.userSessions.get(userId);
    if (userSessionSet) {
      userSessionSet.delete(sessionKey);

      if (userSessionSet.size > 0) {
        console.log(
          `📊 User ${userId} has ${userSessionSet.size} other sessions`,
        );
        return;
      }

      this.userSessions.delete(userId);
    }

    const lastSeenAt = new Date();

    this.usersRepository
      .updateOne({
        query: { _id: userId },
        dto: { lastSeenAt },
      })
      .catch((err) => {
        console.error(`Failed to update lastSeenAt for ${userId}:`, err);
      });

    console.log(`📊 User ${userId} offline completely`);

    this.broadcastToWatchers(userId, SocketEvents.PRESENCE_USER_OFFLINE, {
      userId,
      sessionId: sessionKey.split(':')[1],
      lastSeenAt: lastSeenAt.toISOString(),
      isOnline: false,
    });

    spaceIds.forEach((spaceId) => {
      this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_OFFLINE, {
        userId,
        sessionId: sessionKey.split(':')[1],
        spaceId,
        lastSeenAt: lastSeenAt.toISOString(),
      });
    });
  }

  @SubscribeMessage(SocketEvents.USER_LOGOUT)
  async handleLogout(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string;
    const sessionKey = client.data.sessionKey as string;

    if (!userId || !sessionKey) {
      return { success: false, error: 'Unauthorized' };
    }

    console.log(`🚪 User logout: ${userId}, session: ${sessionKey}`);

    const sessionId = sessionKey.split(':')[1];

    this.sessionConnections.delete(sessionKey);

    const userSessionSet = this.userSessions.get(userId);
    if (userSessionSet) {
      userSessionSet.delete(sessionKey);

      if (userSessionSet.size > 0) {
        console.log(
          `📊 User ${userId} has ${userSessionSet.size} other sessions`,
        );

        this.socketEmitter.emitToUser(userId, SocketEvents.USER_OFFLINE, {
          userId,
          sessionId,
          isSelf: true,
        });

        return { success: true };
      }

      this.userSessions.delete(userId);
    }

    const lastSeenAt = new Date();

    this.usersRepository
      .updateOne({
        query: { _id: userId },
        dto: { lastSeenAt },
      })
      .catch((err) => {
        console.error(`Failed to update lastSeenAt for ${userId}:`, err);
      });

    const offlinePayload = {
      userId,
      sessionId,
      lastSeenAt: lastSeenAt.toISOString(),
    };

    this.broadcastToWatchers(userId, SocketEvents.PRESENCE_USER_OFFLINE, {
      userId,
      sessionId,
      lastSeenAt: lastSeenAt.toISOString(),
      isOnline: false,
    });

    if (userSessionSet) {
      const remainingSessions = Array.from(userSessionSet);
      remainingSessions.forEach((otherSessionKey) => {
        const otherSockets = this.sessionConnections.get(otherSessionKey);
        if (otherSockets) {
          otherSockets.forEach((socketId) => {
            const socket = this.server.sockets.sockets.get(socketId);
            if (socket) socket.disconnect(true);
          });
          this.sessionConnections.delete(otherSessionKey);
        }
      });
    }

    return { success: true };
  }

  @SubscribeMessage(SocketEvents.PRESENCE_ONLINE_SESSIONS)
  async getUserSessions(@MessageBody() dto: { userId: string }) {
    const sessions = this.userSessions.get(dto.userId);
    return {
      success: true,
      userId: dto.userId,
      sessionCount: sessions ? sessions.size : 0,
      sessions: sessions ? Array.from(sessions) : [],
    };
  }
}
