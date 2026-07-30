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
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { RoomNames } from '../../../../common/utils/room-names';
import { SocketEvents, SpaceTypes } from '../../../../common/types/enums';
import { UsersRepository } from '../../../../common/modules/iam/users/users.repository';

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
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  afterInit(server: Server) {
    this.registry.setServer(server);
  }

  private getSessionKey(userId: string, sessionId: string): string {
    return `${userId}:${sessionId}`;
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

    const memberships = await this.membersRepository.findMany({
      query: { user: userId, isDeleted: false },
      select: 'space',
    });

    if (!this.sessionConnections.get(sessionKey)?.has(client.id)) {
      return;
    }

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

    client.data.spaceIds = spaceIds;
    client.data.sessionKey = sessionKey;

    if (isFirstConnectionInSession) {
      if (isNewSession) {
        console.log(`🟢 First session for user ${userId}, broadcasting ONLINE`);

        spaceIds.forEach((spaceId) => {
          this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_ONLINE, {
            userId,
            sessionId,
            spaceId,
          });
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

      const lastSeenAt = new Date();
      await this.usersRepository.updateOne({
        query: { _id: userId },
        dto: { lastSeenAt },
      });

      console.log(`📊 User ${userId} offline completely`);

      spaceIds.forEach((spaceId) => {
        this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_OFFLINE, {
          userId,
          sessionId: sessionKey.split(':')[1],
          spaceId,
          lastSeenAt: lastSeenAt.toISOString(),
        });
      });
    }
  }

  @SubscribeMessage(SocketEvents.USER_LOGOUT)
  async handleLogout(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string;
    const sessionKey = client.data.sessionKey as string;

    if (!userId || !sessionKey) {
      return { success: false, error: 'Unauthorized' };
    }

    console.log(`🚪 User logout: ${userId}, session: ${sessionKey}`);

    const spaceIds = (client.data.spaceIds as string[]) ?? [];
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
    await this.usersRepository.updateOne({
      query: { _id: userId },
      dto: { lastSeenAt },
    });

    spaceIds.forEach((spaceId) => {
      this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_OFFLINE, {
        userId,
        sessionId,
        spaceId,
        lastSeenAt: lastSeenAt.toISOString(),
      });
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

  @SubscribeMessage(SocketEvents.PRESENCE_ONLINE_USERS)
  async onGetOnlineUsers(@MessageBody() dto: { userIds: string[] }) {
    const requestedIds = dto?.userIds ?? [];

    const onlineUserIds = requestedIds.filter((id) => {
      const sessions = this.userSessions.get(id);
      return sessions && sessions.size > 0;
    });

    const onlineSet = new Set(onlineUserIds);
    const offlineIds = requestedIds.filter((id) => !onlineSet.has(id));

    const lastSeenMap: Record<string, string | null> = {};

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

    return { success: true, onlineUserIds, lastSeenMap };
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
