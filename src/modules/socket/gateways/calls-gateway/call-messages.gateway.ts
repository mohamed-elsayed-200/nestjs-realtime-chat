import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { SocketEvents } from '../../../../common/types/enums';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { ReactionMessageDto } from './dto/reaction-message.dto';
import { PinMessageDto } from './dto/pin-message.dto';
import { TypingDto } from './dto/typing-dto';

@WebSocketGateway({ cors: true })
export class CallMessagesGateway {
  constructor(private readonly socketEmitter: SocketEmitterService) {}

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_SEND)
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const authUser = client.data.user as string;
    try {
      this.socketEmitter.emitToCall(
        dto.callId?.toString(),
        SocketEvents.CALL_MESSAGE_NEW,
        dto,
        client?.id,
      );

      return { success: true, message: dto };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_SEND,
        message: err?.message ?? 'Failed to send message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_EDIT)
  async onEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateMessageDto,
  ) {
    const authUser = client.data.user;
    try {
      this.socketEmitter.emitToCall(
        dto.callId?.toString(),
        SocketEvents.CALL_MESSAGE_EDITED,
        dto,
        client?.id,
      );
      return { success: true, message: dto };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_EDIT,
        message: err?.message ?? 'Failed to edit message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_DELETE)
  async onDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: DeleteMessageDto,
  ) {
    const authUser = client.data.user;
    try {
      if (dto.everybody) {
        this.socketEmitter.emitToCall(
          dto.callId,
          SocketEvents.CALL_MESSAGE_DELETED,
          {
            messageIds: dto.messages,
            callIdId: dto.callId,
          },
          client?.id,
        );
      } else {
        this.socketEmitter.emitToUser(
          authUser?._id,
          SocketEvents.CALL_MESSAGE_DELETED,
          {
            messageIds: dto.messages,
            callIdId: dto.callId,
          },
        );
      }

      return { success: true, message: dto };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_DELETE,
        message: err?.message ?? 'Failed to delete message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_REACTION)
  async onReactMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ReactionMessageDto,
  ) {
    const authUser = client.data.user;
    try {
      this.socketEmitter.emitToCall(
        dto.callId,
        SocketEvents.CALL_MESSAGE_REACTED,
        dto,
        client?.id,
      );

      return { success: true, message: dto };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_REACTION,
        message: err?.message ?? 'Failed to react to message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_PIN)
  async onPinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: PinMessageDto,
  ) {
    const authUser = client.data.user as string;
    try {
      this.socketEmitter.emitToCall(
        dto?.callId,
        SocketEvents.CALL_MESSAGE_NEW,
        dto,
        client?.id,
      );

      this.socketEmitter.emitToCall(
        dto?.callId,
        SocketEvents.CALL_MESSAGE_PINNED,
        dto,
        client?.id,
      );

      return { success: true, message: dto };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_PIN,
        message: err?.message ?? 'Failed to pin message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_TYPING)
  onTyping(@ConnectedSocket() client: Socket, @MessageBody() dto: TypingDto) {
    const user = client.data.user;
    this.socketEmitter.emitToCall(
      dto.callId,
      SocketEvents.CALL_MESSAGE_TYPING,
      {
        isTyping: dto.isTyping,
        callId: dto.callId,
        userId: dto?.userId,
        name: user?.name || user?.username || 'user',
        avatar: user?.avatar,
        profileColor: user?.profileColor,
      },
      client?.id,
    );
  }
}
