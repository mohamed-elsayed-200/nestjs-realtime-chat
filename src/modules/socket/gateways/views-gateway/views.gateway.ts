import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { SocketEvents } from '../../../../common/types/enums';
import { ViewsService } from '../../../../modules/users/platform/views/views.service';
import { AddViewDto } from './dto/add-view.dto';

@WebSocketGateway({ cors: true })
export class ViewsGateway {
  constructor(
    private readonly viewsService: ViewsService,
    private readonly socketEmitter: SocketEmitterService,
  ) {}

  @SubscribeMessage(SocketEvents.VIEW_MESSAGE)
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: AddViewDto,
  ) {
    const { target } = dto;
    const authUser = client.data.user as string;
    try {
      const message = await this.viewsService.viewMessage({
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
