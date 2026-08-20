import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketEmitterService } from '../../services/socket-emitter.service';
import { SocketEvents } from '../../../../common/types/enums';
import { AddMembersDto } from './dto/add-members.dto';
import { RoomNames } from '../../../../common/utils/room-names';
import { ToggleBanMemberDto } from './dto/toggle-ban-member.dto';
import { PromoteAdminDto } from './dto/promote-admin.dto';
import { DismissAdminDto } from './dto/dismiss-admin.dto';
import { UpdateAdminPermissionsDto } from './dto/update-admin-permissions.dto';
import { UpdateMemberPermissionsDto } from './dto/update-member-permissions.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { TransferOwnershipService } from '../../../users/platform/members/services/transfer-ownership.service';
import { UpdateAdminPermissionsService } from '../../../users/platform/members/services/update-admin-permissions.service';
import { AddMembersToSpaceService } from '../../../users/platform/members/services/add-members-to-space.service';
import { ToggleBanMemberService } from '../../../users/platform/members/services/toggle-ban.service';
import { PromoteMemberToAdminService } from '../../../users/platform/members/services/promote-member-to-admin.service';
import { DismissMemberFromAdminService } from '../../../users/platform/members/services/dismiss-member-from-admin.service';
import { UpdateMemberPermissionsService } from '../../../users/platform/members/services/update-member-permissions.service';

@WebSocketGateway()
export class MembersGateway {
  constructor(
    private readonly socketEmitter: SocketEmitterService,
    private readonly addMembersToSpaceService: AddMembersToSpaceService,
    private readonly toggleBanMemberService: ToggleBanMemberService,
    private readonly promoteMemberToAdminService: PromoteMemberToAdminService,
    private readonly dismissMemberFromAdminService: DismissMemberFromAdminService,
    private readonly updateAdminPermissionsService: UpdateAdminPermissionsService,
    private readonly updateMemberPermissionsService: UpdateMemberPermissionsService,
    private readonly transferOwnershipService: TransferOwnershipService,
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
        await this.addMembersToSpaceService.add({
          space,
          dto: payload,
          authUser,
        });
      const spaceRoom = RoomNames.space(dto.space);
      client.join(spaceRoom);
      if (addedUserIds?.length > 0) {
        for (const userId of addedUserIds) {
          await this.socketEmitter.joinUserSocketsToRoom(userId, spaceRoom);
        }
      }

      this.socketEmitter.emitToSpace(
        dto.space,
        SocketEvents.MEMBER_ADDED,
        updatedSpace,
        client.id,
      );

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
      const result = await this.toggleBanMemberService.toggle({
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
      const result = await this.promoteMemberToAdminService.promote({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        result.spaceId,
        SocketEvents.MEMBER_ADMIN_PROMOTED,
        result,
        client.id,
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
      const result = await this.dismissMemberFromAdminService.dismiss({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        result.spaceId,
        SocketEvents.MEMBER_ADMIN_DISMISSED,
        result,
        client?.id,
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
      const result = await this.updateAdminPermissionsService.update({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        result.spaceId,
        SocketEvents.MEMBER_ADMIN_PERMISSIONS_UPDATED,
        result,
        client?.id,
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
      const result = await this.updateMemberPermissionsService.update({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        result.spaceId,
        SocketEvents.MEMBER_PERMISSIONS_UPDATED,
        result,
        client?.id,
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
      const result = await this.transferOwnershipService.transfer({
        dto,
        authUser,
      });

      this.socketEmitter.emitToSpace(
        result.spaceId,
        SocketEvents.MEMBER_OWNERSHIP_TRANSFERRED,
        result,
        client?.id,
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
