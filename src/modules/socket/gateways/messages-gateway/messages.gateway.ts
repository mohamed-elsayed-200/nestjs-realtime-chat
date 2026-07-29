import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { MessagesService } from 'src/modules/users/platform/messages/messages.service';
import { SocketEvents } from 'src/common/types/enums';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { TypingDto } from './dto/typing-dto';
import { ForwardMessageDto } from './dto/forward-message.dto';
import { PinMessageDto } from './dto/pin-message.dto';

@WebSocketGateway({ cors: true })
export class MessagesGateway {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly socketEmitter: SocketEmitterService,
  ) {}

  @SubscribeMessage(SocketEvents.MESSAGE_SEND)
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const userId = client.data.userId as string;
    try {
      const message = await this.messagesService.create({
        dto,
        authUser: { _id: userId },
      });

      this.socketEmitter.emitToSpace(
        dto.space,
        SocketEvents.MESSAGE_NEW,
        message,
      );

      return { success: true, message };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MESSAGE_SEND,
        message: err?.message ?? 'Failed to send message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MESSAGE_EDIT)
  async onEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateMessageDto,
  ) {
    const userId = client.data.userId as string;
    try {
      const message = await this.messagesService.update({
        dto,
        authUser: { _id: userId },
      });

      this.socketEmitter.emitToSpace(
        message.space?.toString(),
        SocketEvents.MESSAGE_EDITED,
        message,
      );
      return { success: true, message };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MESSAGE_EDIT,
        message: err?.message ?? 'Failed to edit message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MESSAGE_DELETE)
  async onDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: DeleteMessageDto,
  ) {
    const userId = client.data.userId as string;
    try {
      await this.messagesService.delete({
        dto,
        authUser: { _id: userId },
      });

      this.socketEmitter.emitToSpace(dto.space, SocketEvents.MESSAGE_DELETED, {
        messageId: dto.messages[0],
      });
      return { success: true };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MESSAGE_DELETE,
        message: err?.message ?? 'Failed to delete message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MESSAGE_FORWARD)
  async onForwardMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ForwardMessageDto,
  ) {
    const userId = client.data.userId as string;
    try {
      const forwardedMessages = await this.messagesService.forward({
        dto,
        authUser: { _id: userId },
      });

      for (const msg of forwardedMessages) {
        this.socketEmitter.emitToSpace(
          dto.targetSpace,
          SocketEvents.MESSAGE_NEW,
          msg,
        );
      }

      return { success: true, messages: forwardedMessages };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MESSAGE_FORWARD,
        message: err?.message ?? 'Failed to forward message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MESSAGE_PIN)
  async onPinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: PinMessageDto,
  ) {
    const userId = client.data.userId as string;
    try {
      const result = await this.messagesService.pin({
        dto,
        authUser: { _id: userId },
      });

      this.socketEmitter.emitToSpace(
        dto.space,
        SocketEvents.MESSAGE_NEW,
        result.systemMessage,
      );

      this.socketEmitter.emitToSpace(dto.space, SocketEvents.MESSAGE_PINNED, {
        messages: result.pinnedIds,
        isPinned: dto.isPinned,
        space: dto.space,
        systemMessage: result.systemMessage._id,
      });

      return { success: true, systemMessage: result.systemMessage };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MESSAGE_PIN,
        message: err?.message ?? 'Failed to pin message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MESSAGE_TYPING)
  onTyping(@ConnectedSocket() client: Socket, @MessageBody() dto: TypingDto) {
    const userId = client.data.userId as string;

    client.to(`space:${dto.space}`).emit(SocketEvents.MESSAGE_TYPING, {
      userId,
      space: dto.space,
      isTyping: dto.isTyping,
    });
  }
}
