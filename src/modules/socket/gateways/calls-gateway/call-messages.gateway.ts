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

  private checkAuth(
    client: Socket,
    dtoUserId: string,
  ): { authUser: any; error?: string } {
    const authUser = client.data.user;
    if (!authUser) {
      return { authUser: null, error: 'Unauthorized: no auth user' };
    }
    const authId = authUser._id?.toString?.() || authUser.id?.toString?.();
    if (authId !== dtoUserId) {
      return { authUser: null, error: 'Unauthorized: userId mismatch' };
    }
    return { authUser };
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_SEND)
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const { authUser, error } = this.checkAuth(client, dto.userId);
    if (error) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_SEND,
        message: error,
      });
      return { success: false, error };
    }

    const unifiedMessage = {
      id: dto.id || `${authUser._id}-${Date.now()}`,
      callId: dto.callId,
      senderId: authUser._id?.toString?.() || authUser.id,
      senderName: authUser.name || authUser.username || 'User',
      senderAvatar: authUser.avatar,
      senderProfileColor: authUser.profileColor,
      text: dto.text,
      content: dto.content,
      timestamp: Date.now(),
      messageType: dto.messageType,
      status: dto.status,
      replyTo: dto.replyTo,
      forwardFrom: dto.forwardFrom,
      albumFiles: dto.albumFiles,
      isPinned: dto.isPinned,
      mimeType: dto.mimeType,
      stickerPack: dto.stickerPack,
      stickerId: dto.stickerId,
      gifId: dto.gifId,
      gifPack: dto.gifPack,
      duration: dto.duration,
      audioLevels: dto.audioLevels,
    };

    this.socketEmitter.emitToCall(
      dto.callId?.toString(),
      SocketEvents.CALL_MESSAGE_NEW,
      { message: unifiedMessage },
      client?.id,
    );

    return { success: true, message: unifiedMessage };
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_EDIT)
  async onEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateMessageDto,
  ) {
    const { authUser, error } = this.checkAuth(client, dto.userId);
    if (error) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_EDIT,
        message: error,
      });
      return { success: false, error };
    }

    const unifiedPayload = {
      message: {
        id: dto.message,
        callId: dto.callId,
        text: dto.text,
        content: dto.content,
        edited: true,
        editedAt: Date.now(),
      },
    };

    this.socketEmitter.emitToCall(
      dto.callId?.toString(),
      SocketEvents.CALL_MESSAGE_EDITED,
      unifiedPayload,
      client?.id,
    );

    return { success: true, ...unifiedPayload };
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_DELETE)
  async onDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: DeleteMessageDto,
  ) {
    const { authUser, error } = this.checkAuth(client, dto.userId);
    if (error) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_DELETE,
        message: error,
      });
      return { success: false, error };
    }

    const messageId = dto.messages?.[0]?.toString?.();

    if (dto.everybody) {
      this.socketEmitter.emitToCall(
        dto.callId?.toString(),
        SocketEvents.CALL_MESSAGE_DELETED,
        { messageId, deletedBy: authUser._id?.toString?.() },
        client?.id,
      );
    } else {
      this.socketEmitter.emitToUser(
        authUser._id?.toString?.(),
        SocketEvents.CALL_MESSAGE_DELETED,
        { messageId, forMe: true },
      );
    }

    return { success: true, messageId };
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_REACTION)
  async onReactMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ReactionMessageDto,
  ) {
    const { authUser, error } = this.checkAuth(client, dto.userId);
    if (error) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_REACTION,
        message: error,
      });
      return { success: false, error };
    }

    const unifiedPayload = {
      messageId: dto.message,
      emoji: dto.emoji,
      userId: authUser._id?.toString?.() || authUser.id,
    };

    this.socketEmitter.emitToCall(
      dto.callId?.toString(),
      SocketEvents.CALL_MESSAGE_REACTED,
      unifiedPayload,
      client?.id,
    );

    return { success: true, ...unifiedPayload };
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_PIN)
  async onPinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: PinMessageDto,
  ) {
    const { authUser, error } = this.checkAuth(client, dto.userId);
    if (error) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_PIN,
        message: error,
      });
      return { success: false, error };
    }

    const messageId = dto.messages?.[0];

    this.socketEmitter.emitToCall(
      dto.callId?.toString(),
      SocketEvents.CALL_MESSAGE_PINNED,
      {
        messageId,
        isPinned: dto.isPinned,
        pinnedBy: authUser._id?.toString?.(),
      },
      client?.id,
    );

    return { success: true, messageId };
  }

  @SubscribeMessage(SocketEvents.CALL_MESSAGE_TYPING)
  onTyping(@ConnectedSocket() client: Socket, @MessageBody() dto: TypingDto) {
    const user = client.data.user;
    const authId = user?._id?.toString?.() || user?.id?.toString?.();

    if (authId !== dto.userId) {
      client.emit('error', {
        event: SocketEvents.CALL_MESSAGE_TYPING,
        message: 'Unauthorized: userId mismatch',
      });
      return { success: false, error: 'Unauthorized: userId mismatch' };
    }

    this.socketEmitter.emitToCall(
      dto.callId?.toString(),
      SocketEvents.CALL_MESSAGE_TYPING,
      {
        isTyping: dto.isTyping,
        callId: dto.callId,
        userId: authId,
        name: user?.name || user?.username || 'User',
        avatar: user?.avatar,
        profileColor: user?.profileColor,
      },
      client?.id,
    );

    return { success: true };
  }
}
