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
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';

@Injectable()
export class ToggleBanMemberService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly spacesRepository: SpacesRepository,
  ) {}

  public async toggle({ dto, authUser }) {
    const { member, space, bannedReason } = dto;
    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });

    if (!authMember) throw new NotFoundException('members.noPermission');

    const isOwner = authMember.role === SpaceMemberRole.OWNER;
    const isAdmin =
      authMember.role === SpaceMemberRole.ADMIN &&
      authMember.permissions?.includes(SpaceMemberPermission.BAN_MEMBERS);
    const canBan = isOwner || isAdmin;
    if (!canBan) throw new BadRequestException('members.noPermission');

    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId },
    });

    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role === SpaceMemberRole.OWNER)
      throw new BadRequestException('members.cannotModifyOwner');
    if (targetMember.role === SpaceMemberRole.ADMIN && !isOwner)
      throw new BadRequestException('members.noPermission');

    const isBanned = targetMember.isBanned;

    if (!isBanned) {
      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { $inc: { membersCount: -1 } },
      });
    }

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: isBanned
        ? {
            isBanned: false,
            bannedReason: null,
            bannedAt: null,
            bannedBy: null,
            permission: memberPermissionList,
            role: SpaceMemberRole.MEMBER,
          }
        : {
            isDeleted: true,
            isBanned: true,
            bannedReason: bannedReason ?? null,
            bannedAt: new Date(),
            bannedBy: userObjectId,
            permission: memberPermissionList,
            role: SpaceMemberRole.MEMBER,
          },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');

    return {
      ...updated.toObject(),
      id: updated?.id?.toString(),
      spaceId: updated?.space?.toString(),
      __v: undefined,
      _id: undefined,
    };
  }
}
