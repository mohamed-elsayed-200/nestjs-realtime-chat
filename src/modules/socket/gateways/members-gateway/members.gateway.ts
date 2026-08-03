import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { MembersService } from '../../../users/platform/members/members.service';
import { SocketEvents } from '../../../../common/types/enums';
import { AddMembersDto } from './dto/add-members.dto';
import { RoomNames } from '../../../../common/utils/room-names';
import { ToggleBanMemberDto } from './dto/toggle-ban-member.dto';
import { PromoteAdminDto } from './dto/promote-admin.dto';
import { DismissAdminDto } from './dto/dismiss-admin.dto';
import { UpdateAdminPermissionsDto } from './dto/update-admin-permissions.dto';
import { UpdateMemberPermissionsDto } from './dto/update-member-permissions.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';

@WebSocketGateway({ cors: true })
export class MembersGateway {
  constructor(
    private readonly membersService: MembersService,
    private readonly socketEmitter: SocketEmitterService,
  ) {}

  @SubscribeMessage(SocketEvents.MEMBER_ADD)
  async onAddMember(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: AddMembersDto,
  ) {
    const authUser = client.data.user;
    const { space, ...payload } = dto;

    try {
      const { space: updatedSpace, addedUserIds } =
        await this.membersService.addMembers({
          space,
          dto: payload,
          authUser,
        });

      this.socketEmitter.emitToSpace(
        dto.space,
        SocketEvents.MEMBER_ADDED,
        updatedSpace,
        client.id,
      );

      if (addedUserIds?.length > 0) {
        for (const userId of addedUserIds) {
          this.socketEmitter.emitToUser(
            userId,
            SocketEvents.MEMBER_ADDED,
            updatedSpace,
          );
        }
      }

      return { success: true, space: updatedSpace };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MEMBER_ADDED,
        message: err?.message ?? 'Failed to add member',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MEMBER_TOGGLE_BAN)
  async onToggleBan(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ToggleBanMemberDto,
  ) {
    const authUser = client.data.user;

    try {
      const result = await this.membersService.toggleBan({
        authUser,
        dto,
      });

      const isBanned = result?.isBanned;

      if (isBanned) {
        this.socketEmitter.emitToUser(
          result.user?.toString(),
          SocketEvents.MEMBER_REMOVED,
          { spaceId: result?.space, memberId: result.id },
        );

        const room = RoomNames.space(dto.space);
        const sockets = await client.nsp.in(room).fetchSockets();
        const targetSocket = sockets.find(
          (s) => s.data.userId === result.user?.toString(),
        );

        targetSocket?.leave(room);
      }

      return { success: true, result };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MEMBER_TOGGLE_BAN,
        message: err?.message ?? 'Failed to toggle ban',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MEMBER_PROMOTE_ADMIN)
  async onPromoteAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: PromoteAdminDto,
  ) {
    const authUser = client.data.user;

    try {
      const result = await this.membersService.promoteAdmin({ dto, authUser });

      this.socketEmitter.emitToSpace(
        dto.space,
        SocketEvents.MEMBER_ADMIN_PROMOTED,
        result,
      );

      return { success: true, result };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MEMBER_ADMIN_PROMOTED,
        message: err?.message ?? 'Failed to promote admin',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MEMBER_DISMISS_ADMIN)
  async onDismissAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: DismissAdminDto,
  ) {
    const authUser = client.data.user;

    try {
      const result = await this.membersService.dismissAdmin({ dto, authUser });

      this.socketEmitter.emitToSpace(
        dto.space,
        SocketEvents.MEMBER_ADMIN_DISMISSED,
        result,
      );

      return { success: true, result };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MEMBER_ADMIN_DISMISSED,
        message: err?.message ?? 'Failed to dismiss admin',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MEMBER_UPDATE_ADMIN_PERMISSIONS)
  async onUpdateAdminPermissions(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateAdminPermissionsDto,
  ) {
    const authUser = client.data.user;

    try {
      const result = await this.membersService.updateAdminPermissions({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        dto.space,
        SocketEvents.MEMBER_ADMIN_PERMISSIONS_UPDATED,
        result,
      );

      return { success: true, result };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MEMBER_ADMIN_PERMISSIONS_UPDATED,
        message: err?.message ?? 'Failed to update admin permissions',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MEMBER_UPDATE_PERMISSIONS)
  async onUpdateMemberPermissions(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateMemberPermissionsDto,
  ) {
    const authUser = client.data.user;

    try {
      const result = await this.membersService.updateMemberPermissions({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        dto.space,
        SocketEvents.MEMBER_PERMISSIONS_UPDATED,
        result,
      );

      return { success: true, result };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MEMBER_PERMISSIONS_UPDATED,
        message: err?.message ?? 'Failed to update member permissions',
      });
      return { success: false, error: err?.message };
    }
  }

  @SubscribeMessage(SocketEvents.MEMBER_TRANSFER_OWNERSHIP)
  async onTransferOwnership(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: TransferOwnershipDto,
  ) {
    const authUser = client.data.user;

    try {
      const result = await this.membersService.transferOwnership({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        dto.space,
        SocketEvents.MEMBER_OWNERSHIP_TRANSFERRED,
        result,
      );

      return { success: true, result };
    } catch (err: any) {
      client.emit('error', {
        event: SocketEvents.MEMBER_OWNERSHIP_TRANSFERRED,
        message: err?.message ?? 'Failed to transfer ownership',
      });
      return { success: false, error: err?.message };
    }
  }
}
