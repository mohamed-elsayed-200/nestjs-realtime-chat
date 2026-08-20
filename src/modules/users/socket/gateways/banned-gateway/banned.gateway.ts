import { ToggleBanService } from './../../../platform/banned/services/toggle-ban.service';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { SocketEvents } from '../../../../../common/types/enums';
import { ToggleBanDto } from './dto/toggle-ban.dto';

@WebSocketGateway()
export class BannedGateway {
  constructor(
    private readonly toggleBanService: ToggleBanService,
    private readonly socketEmitter: SocketEmitterService,
  ) {}

  @SubscribeMessage(SocketEvents.BAN_TOGGLE)
  async onToggleBan(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ToggleBanDto,
  ) {
    const { target } = dto;
    const authUser = client.data.user;

    try {
      const result = await this.toggleBanService.toggle({
        userId: target,
        authUser,
      });

      this.socketEmitter.emitToUser(target, SocketEvents.BAN_TOGGLED, {
        ...result,
        by: {
          id: authUser?._id,
          avatar: authUser?.avatar ?? null,
          profileColor: authUser?.profileColor ?? null,
        },
      });

      return { success: true, ...result };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.BAN_TOGGLE,
        message: err?.message ?? 'Failed to toggle block',
      });
      return { success: false, error: err?.message };
    }
  }
}
