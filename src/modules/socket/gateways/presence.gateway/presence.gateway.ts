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

  // Track live socket ids per user instead of a plain counter.
  // A counter can't tell "never connected" apart from "just went to zero",
  // which is what caused the online/offline race in the previous version.
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly registry: SocketServerRegistry,
    private readonly socketEmitter: SocketEmitterService,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  afterInit(server: Server) {
    this.registry.setServer(server);
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }

    client.join(RoomNames.user(userId));

    // Register this socket immediately (synchronously), BEFORE any await.
    // This closes the race window: if a disconnect fires while the DB
    // lookup below is still pending, handleDisconnect will already see
    // this socket id in the set and can correctly remove it, rather than
    // finding "no entry" and guessing.
    const sockets = this.userSockets.get(userId) ?? new Set<string>();
    const isFirstConnection = sockets.size === 0;
    sockets.add(client.id);
    this.userSockets.set(userId, sockets);

    const memberships = await this.membersRepository.findMany({
      query: { user: userId, isDeleted: false },
      select: 'space',
    });

    // The socket may have disconnected while we were awaiting the query above.
    // If so, don't join rooms or announce presence for a socket that's already gone.
    if (!this.userSockets.get(userId)?.has(client.id)) {
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

    if (isFirstConnection) {
      spaceIds.forEach((spaceId) => {
        this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_ONLINE, {
          userId,
          spaceId,
        });
      });
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string;
    if (!userId) return;

    const spaceIds = (client.data.spaceIds as string[]) ?? [];
    const sockets = this.userSockets.get(userId);

    if (!sockets) return;

    sockets.delete(client.id);

    if (sockets.size > 0) {
      // user still has other active tabs/devices — stay online
      return;
    }

    this.userSockets.delete(userId);

    const lastSeenAt = new Date();
    await this.usersRepository.updateOne({
      query: { _id: userId },
      dto: { lastSeenAt },
    });

    // If the user reconnected (e.g. new tab) while we were awaiting the
    // write above, don't announce them offline — they're back online.
    if (this.userSockets.has(userId)) return;

    spaceIds.forEach((spaceId) => {
      this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_OFFLINE, {
        userId,
        spaceId,
        lastSeenAt: lastSeenAt.toISOString(),
      });
    });
  }

  @SubscribeMessage(SocketEvents.PRESENCE_ONLINE_USERS)
  async onGetOnlineUsers(@MessageBody() dto: { userIds: string[] }) {
    const requestedIds = dto?.userIds ?? [];

    const onlineUserIds = requestedIds.filter((id) => this.userSockets.has(id));
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
}
