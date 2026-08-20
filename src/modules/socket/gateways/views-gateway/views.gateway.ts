import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEvents } from '../../../../common/types/enums';
import { AddViewDto } from './dto/add-view.dto';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { ViewMessageService } from '../../../users/platform/views/services/view-message.service';

@WebSocketGateway()
export class ViewsGateway {
  constructor(
    private readonly viewMessageService: ViewMessageService,
    private readonly socketEmitter: SocketEmitterService,
  ) {}

  @SubscribeMessage(SocketEvents.VIEW_MESSAGE)
  async onViewMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: AddViewDto,
  ) {
    const { target } = dto;
    const authUser = client.data.user as string;

    try {
      const message = await this.viewMessageService.view({
        message: target,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        message.space?.toString(),
        SocketEvents.VIEWED_MESSAGE,
        message,
      );

      return { success: true, message };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.VIEW_MESSAGE,
        message: err?.message ?? 'Failed to send message',
      });
      return { success: false, error: err?.message };
    }
  }
}
