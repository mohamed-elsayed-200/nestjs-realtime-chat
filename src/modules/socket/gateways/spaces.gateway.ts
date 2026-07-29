import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../services/socket-emitter.service';
import { SpacesService } from 'src/modules/users/platform/spaces/spaces.service';
import { SocketEvents } from 'src/common/types/enums';
import { RoomNames } from 'src/common/utils/room-names';

interface JoinLeaveSocketDto {
  spaceId: string;
}

@WebSocketGateway({ cors: true })
export class SpacesGateway {
  constructor(
    private readonly spacesService: SpacesService,
    private readonly socketEmitter: SocketEmitterService,
  ) {}

  @SubscribeMessage(SocketEvents.SPACE_JOIN)
  onJoinSpace(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinLeaveSocketDto,
  ) {
    return this.handleJoin(client, dto.spaceId, SocketEvents.SPACE_JOINED);
  }

  @SubscribeMessage(SocketEvents.SPACE_LEAVE)
  onLeaveSpace(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinLeaveSocketDto,
  ) {
    return this.handleLeave(client, dto.spaceId, SocketEvents.SPACE_LEFT);
  }

  private async handleJoin(
    client: Socket,
    spaceId: string,
    joinedEvent: SocketEvents,
  ) {
    const userId = client.data.userId as string;
    try {
      const updatedSpace = await this.spacesService.joinToSpace({
        spaceId,
        authUser: { _id: userId },
      });

      client.join(RoomNames.space(spaceId));

      client.emit(joinedEvent, updatedSpace);
      this.socketEmitter.emitToSpace(spaceId, joinedEvent, { spaceId, userId });

      return { success: true, space: updatedSpace };
    } catch (err: any) {
      client.emit('error', {
        event: joinedEvent,
        message: err?.message ?? 'Failed to join space',
      });
      return { success: false, error: err?.message };
    }
  }

  private async handleLeave(
    client: Socket,
    spaceId: string,
    leftEvent: SocketEvents,
  ) {
    const userId = client.data.userId as string;
    try {
      const updatedSpace = await this.spacesService.leaveFromSpace({
        spaceId,
        authUser: { _id: userId },
      });

      client.leave(RoomNames.space(spaceId));

      client.emit(leftEvent, { spaceId });
      this.socketEmitter.emitToSpace(spaceId, leftEvent, { spaceId, userId });

      return { success: true, space: updatedSpace };
    } catch (err: any) {
      client.emit('error', {
        event: leftEvent,
        message: err?.message ?? 'Failed to leave space',
      });
      return { success: false, error: err?.message };
    }
  }
}
