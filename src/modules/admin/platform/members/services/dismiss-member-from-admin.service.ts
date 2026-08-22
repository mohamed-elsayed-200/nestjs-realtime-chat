import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  memberPermissionList,
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../../common/types/enums';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class DismissMemberFromAdminService {
  constructor(private readonly membersRepository: MembersRepository) {}

  public async dismiss({ dto, authUser }) {
    const { member, space } = dto;

    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    // 1. Auth: Owner or Admin with MANAGE_ADMINS
    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!authMember) throw new NotFoundException('members.noPermission');

    const isOwner = authMember.role === SpaceMemberRole.OWNER;
    const isAdmin = authMember.role === SpaceMemberRole.ADMIN;
    const canManageAdmins = authMember.permissions?.includes(
      SpaceMemberPermission.ADD_ADMINS,
    );

    if (!isOwner && !(isAdmin && canManageAdmins)) {
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

    // 2.1 Non-owner admins can only dismiss admins they personally promoted
    if (
      !isOwner &&
      targetMember.promotedBy?.toString() !== userObjectId.toString()
    ) {
      throw new BadRequestException('members.noPermission');
    }

    // 3. Dismiss: keep member-level permissions only
    const currentPerms = targetMember.permissions || [];
    const keptPerms = currentPerms.filter((p) =>
      memberPermissionList.includes(p),
    );

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        role: SpaceMemberRole.MEMBER,
        permissions: keptPerms,
        adminTag: null,
        adminTagColor: null,
        promotedBy: null,
      },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');
    return {
      memberId: updated?._id?.toString(),
      spaceId: updated?.space?.toString(),
      userId: updated?.user?.toString(),
      role: updated?.role,
      permissions: updated?.permissions,
      promotedBy: null,
      adminTag: null,
      adminTagColor: null,
    };
  }
}
