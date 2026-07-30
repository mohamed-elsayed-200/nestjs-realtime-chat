import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketServerRegistry } from '../../services/socket-server.registry';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { RoomNames } from '../../../../common/utils/room-names';
import { SocketEvents } from '../../../../common/types/enums';

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

    const spaceIds = memberships
      .map((m: any) => m.space?.toString?.())
      .filter(Boolean);

    spaceIds.forEach((spaceId) => {
      client.join(RoomNames.space(spaceId));
    });

    client.data.spaceIds = spaceIds;

    const count = (this.onlineConnectionsCount.get(userId) ?? 0) + 1;
    this.onlineConnectionsCount.set(userId, count);

    if (count === 1) {
      spaceIds.forEach((spaceId) => {
        this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_ONLINE, {
          userId,
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

      spaceIds.forEach((spaceId) => {
        this.socketEmitter.emitToSpace(spaceId, SocketEvents.USER_OFFLINE, {
          userId,
        });
      });
    } else {
      this.onlineConnectionsCount.set(userId, count);
    }
  }
}
