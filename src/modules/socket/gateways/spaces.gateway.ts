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

  @SubscribeMessage(SocketEvents.CHANNEL_JOIN)
  onJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinLeaveSocketDto,
  ) {
    return this.handleJoin(client, dto.spaceId, SocketEvents.CHANNEL_JOINED);
  }

  @SubscribeMessage(SocketEvents.CHANNEL_LEAVE)
  onLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinLeaveSocketDto,
  ) {
    return this.handleLeave(client, dto.spaceId, SocketEvents.CHANNEL_LEFT);
  }

  @SubscribeMessage(SocketEvents.GROUP_JOIN)
  onJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinLeaveSocketDto,
  ) {
    return this.handleJoin(client, dto.spaceId, SocketEvents.GROUP_JOINED);
  }

  @SubscribeMessage(SocketEvents.GROUP_LEAVE)
  onLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinLeaveSocketDto,
  ) {
    return this.handleLeave(client, dto.spaceId, SocketEvents.GROUP_LEFT);
  }

  @SubscribeMessage(SocketEvents.COMMUNITY_JOIN)
  async onJoinCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinLeaveSocketDto,
  ) {
    const userId = client.data.userId as string;
    try {
      const updatedSpace = await this.spacesService.joinToSpace({
        spaceId: dto.spaceId,
        authUser: { _id: userId },
      });

      client.join(RoomNames.space(dto.spaceId));
      client.join(RoomNames.community(dto.spaceId));

      client.emit(SocketEvents.COMMUNITY_JOINED, updatedSpace);
      this.socketEmitter.emitToSpace(
        dto.spaceId,
        SocketEvents.COMMUNITY_JOINED,
        {
          spaceId: dto.spaceId,
          userId,
        },
      );

      return { success: true, space: updatedSpace };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.COMMUNITY_JOIN,
        message: err?.message ?? 'Failed to join community',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.COMMUNITY_LEAVE)
  async onLeaveCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinLeaveSocketDto,
  ) {
    const userId = client.data.userId as string;
    try {
      const updatedSpace = await this.spacesService.leaveFromSpace({
        spaceId: dto.spaceId,
        authUser: { _id: userId },
      });

      client.leave(RoomNames.space(dto.spaceId));
      client.leave(RoomNames.community(dto.spaceId));

      client.emit(SocketEvents.COMMUNITY_LEFT, { spaceId: dto.spaceId });
      this.socketEmitter.emitToSpace(dto.spaceId, SocketEvents.COMMUNITY_LEFT, {
        spaceId: dto.spaceId,
        userId,
      });

      return { success: true, space: updatedSpace };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.COMMUNITY_LEAVE,
        message: err?.message ?? 'Failed to leave community',
      });
      return { success: false, error: err?.message };
    }
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
