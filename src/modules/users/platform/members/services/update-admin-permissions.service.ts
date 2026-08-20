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
export class UpdateAdminPermissionsService {
  constructor(private readonly membersRepository: MembersRepository) {}

  public async update({ dto, authUser }) {
    const { member, space, permissions, adminTag, adminTagColor } = dto;

    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    // 1. Auth: Owner or Admin with MANAGE_ADMINS
    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!authMember) throw new NotFoundException('members.noPermission');

    const iamOwner = authMember.role === SpaceMemberRole.OWNER;
    const canChangeAdminPerm = authMember.permissions?.includes(
      SpaceMemberPermission.ADD_ADMINS,
    );
    if (!iamOwner && !canChangeAdminPerm) {
      throw new BadRequestException('members.noPermission');
    }

    // 2. Target member
    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId, isDeleted: false },
    });
    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role !== SpaceMemberRole.ADMIN) {
      throw new BadRequestException('members.notAdmin');
    }

    // 2.1 Non-owner admins can only manage admins they personally promoted
    if (
      !iamOwner &&
      targetMember.promotedBy?.toString() !== userObjectId.toString()
    ) {
      throw new BadRequestException('members.noPermission');
    }

    // 3. Validate requested permissions against the full valid list (member + admin)
    const validPermissions: string[] = [
      ...memberPermissionList,
      ...adminPermissionList,
    ];
    const uniquePermissions = [...new Set(permissions as string[])];
    const filtered = uniquePermissions.filter((p) =>
      validPermissions.includes(p),
    );

    // 4. Split current permissions into member vs admin buckets using the shared lists
    const currentPerms = targetMember.permissions || [];
    const memberPerms = currentPerms.filter((p) =>
      memberPermissionList.includes(p),
    );
    const currentAdminPerms = currentPerms.filter((p) =>
      adminPermissionList.includes(p),
    );

    // 5. Determine which admin-level permissions authUser is actually allowed to touch.
    //    Owner controls all admin perms; a regular admin only controls admin perms they own.
    const authControlledPerms = iamOwner
      ? adminPermissionList
      : (authMember.permissions || []).filter((p) =>
          adminPermissionList.includes(p),
        );

    // Perms the target currently has that authUser has NO control over -> preserve as-is
    const untouchableAdminPerms = currentAdminPerms.filter(
      (p) => !authControlledPerms.includes(p),
    );

    // Perms from the request that authUser IS allowed to grant/revoke (admin perms only)
    const editableAdminPerms = filtered.filter(
      (p) => adminPermissionList.includes(p) && authControlledPerms.includes(p),
    );

    const newAdminPerms = [
      ...new Set([...untouchableAdminPerms, ...editableAdminPerms]),
    ];

    // 6. Build update payload
    const updatePayload: any = {
      permissions: [...memberPerms, ...newAdminPerms],
    };

    if (adminTag !== undefined) updatePayload.adminTag = adminTag || 'Admin';
    if (adminTagColor !== undefined)
      updatePayload.adminTagColor = adminTagColor || '#3b82f6';

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: updatePayload,
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');
    return {
      memberId: updated?._id?.toString(),
      spaceId: updated?.space?.toString(),
      userId: updated?.user?.toString(),
      role: updated?.role,
      permissions: updated?.permissions,
      adminTag: updated?.adminTag,
      adminTagColor: updated?.adminTagColor,
    };
  }
}
