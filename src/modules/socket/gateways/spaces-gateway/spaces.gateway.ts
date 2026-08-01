import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { SpacesService } from '../../../users/platform/spaces/spaces.service';
import { SocketEvents } from '../../../../common/types/enums';
import { RoomNames } from '../../../../common/utils/room-names';

interface JoinLeaveSocketDto {
  spaceId: string;
}

@WebSocketGateway({ cors: true })
export class SpacesGateway {
  constructor(
    private readonly spacesService: SpacesService,
    private readonly socketEmitter: SocketEmitterService,
  ) {}

  @SubscribeMessage(SocketEvents.SPACE_READ)
  async onSpaceRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { spaceId: string },
  ) {
    const userId = client.data.userId as string;

    try {
      await this.spacesService.markSpaceAsRead({
        spaceId: dto.spaceId,
        authUser: { _id: userId },
      });

      this.socketEmitter.emitToSpace(dto.spaceId, SocketEvents.SPACE_READABLE, {
        spaceId: dto.spaceId,
        userId,
        readAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.SPACE_JOIN)
  async onJoinSpace(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinLeaveSocketDto,
  ) {
    const userId = client.data.userId as string;
    const { spaceId } = dto;
    try {
      const updatedSpace = await this.spacesService.joinToSpace({
        spaceId,
        authUser: { _id: userId },
      });

      client.join(RoomNames.space(spaceId));

      client.emit(SocketEvents.SPACE_JOINED, updatedSpace);
      this.socketEmitter.emitToSpace(spaceId, SocketEvents.SPACE_JOINED, {
        spaceId,
        userId,
      });

      return { success: true, space: updatedSpace };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.SPACE_JOINED,
        message: err?.message ?? 'Failed to join space',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.SPACE_LEAVE)
  async onLeaveSpace(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinLeaveSocketDto,
  ) {
    const userId = client.data.userId as string;
    const { spaceId } = dto;

    try {
      const updatedSpace = await this.spacesService.leaveFromSpace({
        spaceId,
        authUser: { _id: userId },
      });

      client.leave(RoomNames.space(spaceId));

      client.emit(SocketEvents.SPACE_LEFT, { spaceId });
      this.socketEmitter.emitToSpace(spaceId, SocketEvents.SPACE_LEFT, {
        spaceId,
        userId,
      });

      return { success: true, space: updatedSpace };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.SPACE_LEFT,
        message: err?.message ?? 'Failed to leave space',
      });
      return { success: false, error: err?.message };
    }
  }
}
