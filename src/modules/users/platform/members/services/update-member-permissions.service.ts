import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  adminPermissionList,
  memberPermissionList,
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../../common/types/enums';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class UpdateMemberPermissionsService {
  constructor(private readonly membersRepository: MembersRepository) {}

  public async update({ dto, authUser }) {
    const { member, space, permissions } = dto;

    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    // 1. Auth: Owner or Admin with CHANGE_SPACE_SETTINGS
    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!authMember) throw new NotFoundException('members.noPermission');

    const iamOwner = authMember.role === SpaceMemberRole.OWNER;
    const iamAdmin = authMember.role === SpaceMemberRole.ADMIN;

    if (!iamOwner && !iamAdmin) {
      throw new BadRequestException('members.noPermission');
    }

    // 2. Target member
    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId, isDeleted: false },
    });
    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role === SpaceMemberRole.OWNER) {
      throw new BadRequestException('members.cannotModifyOwner');
    }

    // 2.1 If target is an ADMIN, authUser must also have MANAGE_ADMINS to touch their perms
    if (targetMember.role === SpaceMemberRole.ADMIN) {
      const canManageAdmins = authMember.permissions?.includes(
        SpaceMemberPermission.ADD_ADMINS,
      );
      if (!iamOwner && !canManageAdmins) {
        throw new BadRequestException('members.noPermission');
      }
    }

    // 3. Only accept requested permissions that are valid member permissions
    const uniquePermissions = [...new Set(permissions as string[])];
    const requestedMemberPerms = uniquePermissions.filter((p) =>
      memberPermissionList.includes(p as SpaceMemberPermission),
    );

    // 4. Determine which member-level permissions authUser is actually allowed to touch.
    //    Owner controls all member perms; a regular admin only controls member perms they own.
    const authControlledPerms = iamOwner
      ? memberPermissionList
      : (authMember.permissions || []).filter((p) =>
          memberPermissionList.includes(p as SpaceMemberPermission),
        );

    // 5. Current member perms the target has that authUser has NO control over -> preserve as-is
    const currentPerms = targetMember.permissions || [];
    const currentMemberPerms = currentPerms.filter((p) =>
      memberPermissionList.includes(p as SpaceMemberPermission),
    );
    const untouchableMemberPerms = currentMemberPerms.filter(
      (p) => !authControlledPerms.includes(p as SpaceMemberPermission),
    );

    // 6. Perms from the request that authUser IS allowed to grant/revoke
    const editableMemberPerms = requestedMemberPerms.filter((p) =>
      authControlledPerms.includes(p as SpaceMemberPermission),
    );

    const newMemberPerms = [
      ...new Set([...untouchableMemberPerms, ...editableMemberPerms]),
    ];

    // 7. Keep admin perms as-is + apply new member perms
    const adminPerms = currentPerms.filter((p) =>
      adminPermissionList.includes(p as SpaceMemberPermission),
    );

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        permissions: [...adminPerms, ...newMemberPerms],
      },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');
    return {
      memberId: updated?._id?.toString(),
      spaceId: updated?.space?.toString(),
      userId: updated?.user?.toString(),
      role: updated?.role,
      permissions: updated?.permissions,
    };
  }
}
