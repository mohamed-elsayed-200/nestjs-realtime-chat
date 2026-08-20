import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../../common/types/enums';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class PromoteMemberToAdminService {
  constructor(private readonly membersRepository: MembersRepository) {}

  public async promote({ dto, authUser }) {
    const { member, space, permissions, adminTag, adminTagColor } = dto;

    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    // 1. Auth: Owner only
    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });

    if (!authMember) throw new NotFoundException('members.noPermission');
    const iamOwner = authMember.role === SpaceMemberRole.OWNER;
    const iamAdmin = authMember.role === SpaceMemberRole.ADMIN;
    const canPromoteAdmin =
      iamOwner ||
      (iamAdmin &&
        authMember.permissions.includes(SpaceMemberPermission.ADD_ADMINS));

    if (!canPromoteAdmin)
      throw new BadRequestException('members.onlyOwnerCanPromote');

    // 2. Target member
    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId, isDeleted: false },
    });
    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role === SpaceMemberRole.OWNER) {
      throw new BadRequestException('members.cannotModifyOwner');
    }
    if (targetMember.role === SpaceMemberRole.ADMIN) {
      throw new BadRequestException('members.alreadyAdmin');
    }

    // 3. Validate permissions
    const validPermissions = iamOwner
      ? (Object.values(SpaceMemberPermission) as string[])
      : authMember?.permissions;
    const uniquePermissions = [...new Set(permissions as string[])];
    const filtered = uniquePermissions.filter((p) =>
      validPermissions.includes(p),
    );

    // 4. Promote
    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        role: SpaceMemberRole.ADMIN,
        permissions: filtered,
        adminTag: adminTag || 'Admin',
        adminTagColor: adminTagColor || '#3b82f6',
        promotedBy: userObjectId,
      },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');

    return {
      memberId: updated?._id?.toString(),
      spaceId: updated?.space?.toString(),
      userId: updated?.user?.toString(),
      promotedById: updated?.promotedBy,
      role: updated?.role,
      permissions: updated?.permissions,
      adminTag: updated?.adminTag,
      adminTagColor: updated?.adminTagColor,
    };
  }
}
