import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketServerRegistry } from '../services/socket-server.registry';
import { SocketEmitterService } from '../services/socket-emitter.service';
import { MembersRepository } from 'src/common/modules/platform/members/members.repository';
import { RoomNames } from 'src/common/utils/room-names';
import { SocketEvents, SpaceTypes } from 'src/common/types/enums';

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

    const findMemberships = await this.membersRepository.findAll({
      query: { user: userId, isDeleted: false },
      options: { populate: [{ path: 'space' }] },
    });
    const memberships = findMemberships.items;

    memberships.forEach((m: any) => {
      const space = m.space;
      if (!space) return;

      client.join(RoomNames.space(space._id.toString()));

      if (space.parentSpace) {
        client.join(RoomNames.community(space.parentSpace.toString()));
      }

      if (space.type === SpaceTypes.COMMUNITY) {
        client.join(RoomNames.community(space._id.toString()));
      }
    });

    const count = (this.onlineConnectionsCount.get(userId) ?? 0) + 1;
    this.onlineConnectionsCount.set(userId, count);

    if (count === 1) {
      memberships.forEach((m: any) => {
        if (m.space) {
          this.socketEmitter.emitToSpace(
            m.space._id.toString(),
            SocketEvents.USER_ONLINE,
            { userId },
          );
        }
      });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string;
    if (!userId) return;

    const count = (this.onlineConnectionsCount.get(userId) ?? 1) - 1;

    if (count <= 0) {
      this.onlineConnectionsCount.delete(userId);

      this.server.emit(SocketEvents.USER_OFFLINE, { userId });
    } else {
      this.onlineConnectionsCount.set(userId, count);
    }
  }
}
