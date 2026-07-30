import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
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
  private onlineConnectionsCount = new Map<string, number>();

  constructor(
    private readonly registry: SocketServerRegistry,
    private readonly socketEmitter: SocketEmitterService,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  afterInit(server: Server) {
    this.registry.setServer(server);
  }

  async handleConnection(client: Socket) {
    const userId = client.data.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }

    client.join(RoomNames.user(userId));

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

    client.data.spaceIds = spaceIds;

    const count = (this.onlineConnectionsCount.get(userId) ?? 0) + 1;
    this.onlineConnectionsCount.set(userId, count);

    if (count === 1) {
      spaceIds.forEach((spaceId) => {
        this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_ONLINE, {
          userId,
          spaceId,
        });
      });
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId as string;
    const spaceIds = (client.data.spaceIds as string[]) ?? [];

    if (!userId) return;

    const count = (this.onlineConnectionsCount.get(userId) ?? 1) - 1;

    if (count <= 0) {
      this.onlineConnectionsCount.delete(userId);

      const lastSeenAt = new Date();
      await this.usersRepository.updateOne({
        query: { _id: userId },
        dto: { lastSeenAt },
      });

      spaceIds.forEach((spaceId) => {
        this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_OFFLINE, {
          userId,
          spaceId,
          lastSeenAt: lastSeenAt.toISOString(),
        });
      });
    } else {
      this.onlineConnectionsCount.set(userId, count);
    }
  }
  @SubscribeMessage(SocketEvents.PRESENCE_ONLINE_USERS)
  async onGetOnlineUsers(@MessageBody() dto: { userIds: string[] }) {
    const requestedIds = dto?.userIds ?? [];

    const onlineUserIds = requestedIds.filter((id) =>
      this.onlineConnectionsCount.has(id),
    );

    const offlineIds = requestedIds.filter((id) => !onlineUserIds.includes(id));
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
