import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { SpacesService } from '../../../platform/spaces/spaces.service';
import { SocketEvents } from '../../../../../common/types/enums';
import { RoomNames } from '../../../../../common/utils/room-names';
import { JoinToSpaceDto } from './dto/join-to-space.dto';
import { LeaveFromSpaceDto } from './dto/leave-from-space.dto';
import { DeleteSpaceDto } from './dto/delete-space.dto';
import { ChangeWallpaperDto } from './dto/change-wallpaper.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { CreatePrivateSpaceDto } from './dto/create-private-space.dto';

@WebSocketGateway()
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
    const authUser = client.data.user;

    try {
      await this.spacesService.markSpaceAsRead({
        spaceId: dto.spaceId,
        authUser,
      });

      this.socketEmitter.emitToSpace(dto.spaceId, SocketEvents.SPACE_READABLE, {
        spaceId: dto.spaceId,
        userId: authUser?._id,
        readAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.SPACE_INFO_UPDATE)
  async onUpdateSpaceInfo(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateSpaceDto,
  ) {
    const authUser = client.data.user;
    const { spaceId, ...updateData } = dto;

    try {
      const { space: updatedSpace, systemMessage } =
        await this.spacesService.updateGlobalSpace({
          spaceId,
          dto: updateData,
          authUser,
        });

      this.socketEmitter.emitToSpace(
        spaceId,
        SocketEvents.SPACE_INFO_UPDATED,
        updatedSpace,
        client.id,
      );

      return { success: true, space: updatedSpace, systemMessage };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message ?? 'Failed to update space',
      };
    }
  }

  @SubscribeMessage(SocketEvents.SPACE_CREATE_PRIVATE)
  async onCreatePrivate(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreatePrivateSpaceDto,
  ) {
    const authUser = client.data.user;
    try {
      const createdSpace = await this.spacesService.createPrivateSpace({
        authUser,
        dto,
      });

      client.join(RoomNames.space(createdSpace.id));

      this.socketEmitter.emitToSpace(
        createdSpace.id,
        SocketEvents.SPACE_CREATED_PRIVATE,
        createdSpace,
        client?.id,
      );

      return { success: true, space: createdSpace };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.SPACE_CREATE_PRIVATE,
        message: err?.message ?? 'Failed to create space',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.SPACE_JOIN)
  async onJoinSpace(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinToSpaceDto,
  ) {
    const authUser = client.data.user;
    const { spaceId } = dto;
    try {
      const updatedSpace = await this.spacesService.joinToSpace({
        spaceId,
        authUser,
      });

      client.join(RoomNames.space(spaceId));

      this.socketEmitter.emitToSpace(
        updatedSpace?.id,
        SocketEvents.SPACE_JOINED,
        {
          spaceId: updatedSpace?.id,
          parentSpaceId: updatedSpace?.parentSpace,
          membersCount: updatedSpace?.membersCount,
          channelsCount: updatedSpace?.channelsCount,
          groupsCount: updatedSpace?.groupsCount,
        },
        client?.id,
      );

      return { success: true, space: updatedSpace };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.SPACE_JOIN,
        message: err?.message ?? 'Failed to join space',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.SPACE_LEAVE)
  async onLeaveSpace(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: LeaveFromSpaceDto,
  ) {
    const authUser = client.data.user;
    const { spaceId } = dto;

    try {
      const updatedSpace = await this.spacesService.leaveFromSpace({
        spaceId,
        authUser,
      });

      client.leave(RoomNames.space(spaceId));

      this.socketEmitter.emitToSpace(
        updatedSpace?.id,
        SocketEvents.SPACE_LEFT,
        {
          spaceId: updatedSpace?.id,
          parentSpaceId: updatedSpace?.parentSpace,
          membersCount: updatedSpace?.membersCount,
          channelsCount: updatedSpace?.channelsCount,
          groupsCount: updatedSpace?.groupsCount,
        },
        client?.id,
      );

      return { success: true, space: updatedSpace };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.SPACE_LEFT,
        message: err?.message ?? 'Failed to leave space',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.SPACE_DELETE)
  async onDeleteSpace(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: DeleteSpaceDto,
  ) {
    const authUser = client.data.user;
    const { spaceId, ...payload } = dto;

    try {
      await this.spacesService.deleteSpace({ spaceId, dto: payload, authUser });

      const room = RoomNames.space(spaceId);
      const clientsInRoom = await client.nsp.in(room).fetchSockets();
      clientsInRoom.forEach((s) => s.leave(room));

      this.socketEmitter.emitToSpace(
        spaceId,
        SocketEvents.SPACE_DELETED,
        spaceId,
        client?.id,
      );

      return { success: true, spaceId };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.SPACE_DELETED,
        message: err?.message ?? 'Failed to delete space',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.SPACE_CHANGE_WALLPAPER)
  async onChangeWallpaper(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ChangeWallpaperDto,
  ) {
    const authUser = client.data.user;
    const { spaceId, ...payload } = dto;

    try {
      const updatedSpace = await this.spacesService.changeWallpaper({
        spaceId,
        dto: payload,
        authUser,
      });

      if (dto.everybody) {
        this.socketEmitter.emitToSpace(
          updatedSpace.id,
          SocketEvents.SPACE_WALLPAPER_CHANGED,
          updatedSpace,
          client?.id,
        );
      }

      return { success: true, space: updatedSpace };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.SPACE_WALLPAPER_CHANGED,
        message: err?.message ?? 'Failed to change wallpaper',
      });
      return { success: false, error: err?.message };
    }
  }
}
