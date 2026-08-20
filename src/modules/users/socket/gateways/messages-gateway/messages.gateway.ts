import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { SocketEvents } from '../../../../../common/types/enums';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { TypingDto } from './dto/typing-dto';
import { ForwardMessageDto } from './dto/forward-message.dto';
import { PinMessageDto } from './dto/pin-message.dto';
import { ReactionMessageDto } from './dto/reaction-message.dto';
import { TogglePinMessageService } from './../../../platform/messages/services/toggle-pin.service';
import { ForwardMessageService } from './../../../platform/messages/services/forward-message.service';
import { ToggleReactionMessageService } from './../../../platform/reactions/services/toggle-reaction-message.service';
import { DeleteMessageService } from './../../../platform/messages/services/delete-message.service';
import { UpdateMessageService } from './../../../platform/messages/services/update-message.service';
import { CreateMessageService } from './../../../platform/messages/services/create-message.service';

@WebSocketGateway()
export class MessagesGateway {
  constructor(
    private readonly socketEmitter: SocketEmitterService,
    private readonly createMessageService: CreateMessageService,
    private readonly updateMessageService: UpdateMessageService,
    private readonly deleteMessageService: DeleteMessageService,
    private readonly toggleReactionMessageService: ToggleReactionMessageService,
    private readonly forwardMessageService: ForwardMessageService,
    private readonly togglePinMessageService: TogglePinMessageService,
  ) {}

  @SubscribeMessage(SocketEvents.MESSAGE_SEND)
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const authUser = client.data.user as string;
    try {
      const message = await this.createMessageService.create({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        message.space?.toString(),
        SocketEvents.MESSAGE_NEW,
        message,
        client?.id,
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
    const authUser = client.data.user;
    try {
      const message = await this.updateMessageService.update({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        message.space?.toString(),
        SocketEvents.MESSAGE_EDITED,
        message,
        client?.id,
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
    const userId = client.data.userId;
    const authUser = client.data.user;
    try {
      const result = await this.deleteMessageService.delete({
        dto,
        authUser,
      });

      if (dto.everybody) {
        this.socketEmitter.emitToSpace(
          dto.space,
          SocketEvents.MESSAGE_DELETED,
          {
            messageIds: dto.messages,
            spaceId: dto.space,
          },
          client?.id,
        );
      } else {
        this.socketEmitter.emitToUser(userId, SocketEvents.MESSAGE_DELETED, {
          messageIds: dto.messages,
          spaceId: dto.space,
        });
      }

      return { success: true, lastMessage: result?.lastMessage };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MESSAGE_DELETE,
        message: err?.message ?? 'Failed to delete message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MESSAGE_REACTION)
  async onReactMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ReactionMessageDto,
  ) {
    const authUser = client.data.user;
    try {
      const result = await this.toggleReactionMessageService.toggle({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        dto.space,
        SocketEvents.MESSAGE_REACTED,
        result,
        client?.id,
      );

      return { success: true };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MESSAGE_REACTION,
        message: err?.message ?? 'Failed to react to message',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MESSAGE_FORWARD)
  async onForwardMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ForwardMessageDto,
  ) {
    const authUser = client.data.user;
    try {
      const forwardedMessages = await this.forwardMessageService.forward({
        dto,
        authUser,
      });

      for (const msg of forwardedMessages) {
        this.socketEmitter.emitToSpace(
          dto.targetSpace,
          SocketEvents.MESSAGE_NEW,
          msg,
          client?.id,
        );
      }

      return {
        success: true,
        forwardedMessages: forwardedMessages?.map((el) => el?.id),
      };
    } catch (err: any) {
      console.log('error', err);

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
    const authUser = client.data.user as string;
    try {
      const result = await this.togglePinMessageService.toggle({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        result?.pinnedObj?.spaceId,
        SocketEvents.MESSAGE_NEW,
        result?.systemMessage,
        client?.id,
      );

      this.socketEmitter.emitToSpace(
        result?.pinnedObj?.spaceId,
        SocketEvents.MESSAGE_PINNED,
        result?.pinnedObj,
        client?.id,
      );

      return { success: true, systemMessage: result?.systemMessage };
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
    const user = client.data.user;
    this.socketEmitter.emitToSpace(
      dto.spaceId,
      SocketEvents.MESSAGE_TYPING,
      {
        isTyping: dto.isTyping,
        spaceId: dto.spaceId,
        userId: dto?.userId,
        name: user?.name || user?.username || 'user',
        avatar: user?.avatar,
        profileColor: user?.profileColor,
      },
      client?.id,
    );
  }
}
