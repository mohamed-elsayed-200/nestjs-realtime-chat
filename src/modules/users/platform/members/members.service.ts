import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { Types } from 'mongoose';
import {
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../common/types/enums';

@Injectable()
export class MembersService {
  constructor(private readonly membersRepository: MembersRepository) {}

  public async getAll({ query, spaceId }) {
    return this.membersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'bio'],
        allowedFilterFields: ['status'],
        pipelines: [
          {
            $match: {
              space: new Types.ObjectId(spaceId),
            },
          },
          {
            $lookup: {
              from: 'spaces',
              localField: 'space',
              foreignField: '_id',
              as: 'space',
            },
          },
          {
            $unwind: {
              path: '$space',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              space: {
                id: '$space._id',
                membersCount: '$space.membersCount',
                name: '$space.name',
                type: '$space.type',
                profileColor: '$space.profileColor',
                avatar: '$space.avatar',
              },
              user: {
                id: '$user._id',
                name: '$user.name',
                username: '$user.username',
                profileColor: '$user.profileColor',
                avatar: '$user.avatar',
              },
              role: 1,
              joinedAt: 1,
              adminTag: 1,
              adminTagColor: 1,
              permissions: 1,
            },
          },
        ],
      },
    });
  }

  public async getOne({ memberId }) {
    const member = await this.membersRepository.findOne({
      query: { _id: memberId },
    });

    if (!member) throw new NotFoundException('members.notFound');

    return member;
  }

  public async promoteAdmin({ dto, authUser }) {
    const { permissions, member, adminTag, adminTagColor, space } = dto;
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
      authMember.permissions?.includes(SpaceMemberPermission.ADD_ADMIN);
    const canAddAdmin = isOwner || isAdmin;
    if (!canAddAdmin) throw new BadRequestException('members.noPermission');

    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId },
    });

    if (!targetMember) throw new NotFoundException('members.notFound');

    if (targetMember.role === SpaceMemberRole.OWNER)
      throw new BadRequestException('members.cannotModifyOwner');

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        role: SpaceMemberRole.ADMIN,
        permissions: permissions ?? [],
        adminTag: adminTag ?? 'Admin',
        adminTagColor: adminTagColor ?? '#3b82f6',
      },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');

    return updated;
  }

  public async dismissAdmin({ dto, authUser }) {
    const { member, space } = dto;
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
      authMember.permissions?.includes(SpaceMemberPermission.ADD_ADMIN);
    const canDeleteAdmin = isOwner || isAdmin;
    if (!canDeleteAdmin) throw new BadRequestException('members.noPermission');

    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId },
    });

    if (!targetMember) throw new NotFoundException('members.notFound');

    if (targetMember.role === SpaceMemberRole.OWNER)
      throw new BadRequestException('members.cannotModifyOwner');

    if (targetMember.role !== SpaceMemberRole.ADMIN)
      throw new BadRequestException('members.notAdmin');

    const updated = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        role: SpaceMemberRole.MEMBER,
        permissions: [],
        adminTag: null,
        adminTagColor: null,
      },
    });

    if (!updated) throw new InternalServerErrorException('members.notUpdated');

    return updated;
  }

  public async delete({ memberId }) {
    const item = await this.membersRepository.deleteOne({
      query: { _id: memberId },
    });

    if (!item) throw new NotFoundException('members.notDeleted');

    return item;
  }
}
