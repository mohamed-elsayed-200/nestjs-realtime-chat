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

  private isUserOnline(userId: string): boolean {
    const sessions = this.userSessions.get(userId);
    return !!sessions && sessions.size > 0;
  }

  private getWatchedUserIds(client: Socket): string[] {
    return Array.from(client.rooms)
      .filter((room) => room.startsWith('presence-watch:'))
      .map((room) => room.slice('presence-watch:'.length));
  }

  private broadcastPresence(
    event:
      | SocketEvents.PRESENCE_USER_ONLINE
      | SocketEvents.PRESENCE_USER_OFFLINE,
    userId: string,
    spaceIds: string[],
    payload: Record<string, any>,
  ) {
    const rooms = [
      ...spaceIds.map((id) => RoomNames.space(id)),
      RoomNames.presenceWatch(userId),
    ];
    this.server.to(rooms).emit(event, payload);
  }

  @SubscribeMessage(SocketEvents.PRESENCE_SUBSCRIBE)
  async handlePresenceSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { userIds: string[] },
  ) {
    const currentUserId = client.data.userId as string;
    if (!currentUserId) return { success: false, error: 'Unauthorized' };

    const validUserIds = [...new Set(dto?.userIds ?? [])].filter(
      (id) => id !== currentUserId,
    );

    if (validUserIds.length === 0) {
      return {
        success: true,
        onlineUserIds: [],
        lastSeenMap: {},
        skippedUserIds: [],
      };
    }

    const currentWatched = this.getWatchedUserIds(client).length;
    const remainingCapacity = Math.max(0, MAX_WATCH_USERS - currentWatched);

    const acceptedUserIds = validUserIds.slice(0, remainingCapacity);
    const skippedUserIds = validUserIds.slice(acceptedUserIds.length);

    if (acceptedUserIds.length === 0) {
      return {
        success: false,
        error: `Cannot watch more than ${MAX_WATCH_USERS} users at once`,
        skippedUserIds: validUserIds,
      };
    }

    const onlineUserIds: string[] = [];
    const offlineIds: string[] = [];
    const lastSeenMap: Record<string, string | null> = {};

    acceptedUserIds.forEach((id) => {
      if (this.isUserOnline(id)) {
        onlineUserIds.push(id);
      } else {
        offlineIds.push(id);
      }
    });

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

    acceptedUserIds.forEach((id) => client.join(RoomNames.presenceWatch(id)));

    if (skippedUserIds.length > 0) {
      console.warn(
        `⚠️ User ${currentUserId} hit the ${MAX_WATCH_USERS}-user cap - accepted ${acceptedUserIds.length}, skipped ${skippedUserIds.length}`,
      );
    }

    return { success: true, onlineUserIds, lastSeenMap, skippedUserIds };
  }

  @SubscribeMessage(SocketEvents.PRESENCE_UNSUBSCRIBE)
  handlePresenceUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { userIds?: string[] },
  ) {
    const currentUserId = client.data.userId as string;
    if (!currentUserId) return { success: false, error: 'Unauthorized' };

    const ids = dto?.userIds?.length
      ? dto.userIds
      : this.getWatchedUserIds(client);
    ids.forEach((id) => client.leave(RoomNames.presenceWatch(id)));

    return { success: true };
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
      if (space.parentSpace)
        client.join(RoomNames.community(space.parentSpace.toString()));
      if (space.type === SpaceTypes.COMMUNITY)
        client.join(RoomNames.community(spaceId));
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

    if (!this.sessionConnections.get(sessionKey)?.has(client.id)) return;

    client.data.spaceIds = spaceIds;
    client.data.sessionKey = sessionKey;

    if (isFirstConnectionInSession) {
      if (isNewSession) {
        this.broadcastPresence(
          SocketEvents.PRESENCE_USER_ONLINE,
          userId,
          spaceIds,
          {
            userId,
            sessionId,
          },
        );
      }

      // مزامنة باقي أجهزة/تابات نفس اليوزر (مش presence عادي، ده تحديث ذاتي بس)
      this.socketEmitter.emitToUser(userId, SocketEvents.PRESENCE_USER_ONLINE, {
        userId,
        sessionId,
        isSelf: true,
      });
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string;
    const sessionKey = client.data.sessionKey as string;

    if (!userId || !sessionKey) return;

    const spaceIds = (client.data.spaceIds as string[]) ?? [];
    const sessionSockets = this.sessionConnections.get(sessionKey);
    if (!sessionSockets) return;

    sessionSockets.delete(client.id);
    if (sessionSockets.size > 0) return;

    this.sessionConnections.delete(sessionKey);

    const userSessionSet = this.userSessions.get(userId);
    if (!userSessionSet) return;

    userSessionSet.delete(sessionKey);
    if (userSessionSet.size > 0) return;

    this.userSessions.delete(userId);

    const lastSeenAt = new Date();
    this.usersRepository
      .updateOne({ query: { _id: userId }, dto: { lastSeenAt } })
      .catch((err) =>
        console.error(`Failed to update lastSeenAt for ${userId}:`, err),
      );

    this.broadcastPresence(
      SocketEvents.PRESENCE_USER_OFFLINE,
      userId,
      spaceIds,
      {
        userId,
        sessionId: sessionKey.split(':')[1],
        lastSeenAt: lastSeenAt.toISOString(),
      },
    );
  }

  @SubscribeMessage(SocketEvents.USER_LOGOUT)
  async handleLogout(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string;
    const sessionKey = client.data.sessionKey as string;

    if (!userId || !sessionKey)
      return { success: false, error: 'Unauthorized' };

    const spaceIds = (client.data.spaceIds as string[]) ?? [];
    const sessionId = sessionKey.split(':')[1];

    this.sessionConnections.delete(sessionKey);

    const userSessionSet = this.userSessions.get(userId);
    if (userSessionSet) {
      userSessionSet.delete(sessionKey);

      if (userSessionSet.size > 0) {
        this.socketEmitter.emitToUser(
          userId,
          SocketEvents.PRESENCE_USER_OFFLINE,
          {
            userId,
            sessionId,
            isSelf: true,
          },
        );
        return { success: true };
      }

      this.userSessions.delete(userId);
    }

    const lastSeenAt = new Date();
    this.usersRepository
      .updateOne({ query: { _id: userId }, dto: { lastSeenAt } })
      .catch((err) =>
        console.error(`Failed to update lastSeenAt for ${userId}:`, err),
      );

    this.broadcastPresence(
      SocketEvents.PRESENCE_USER_OFFLINE,
      userId,
      spaceIds,
      {
        userId,
        sessionId,
        lastSeenAt: lastSeenAt.toISOString(),
      },
    );

    if (userSessionSet) {
      Array.from(userSessionSet).forEach((otherSessionKey) => {
        const otherSockets = this.sessionConnections.get(otherSessionKey);
        otherSockets?.forEach((socketId) => {
          this.server.sockets.sockets.get(socketId)?.disconnect(true);
        });
        this.sessionConnections.delete(otherSessionKey);
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
