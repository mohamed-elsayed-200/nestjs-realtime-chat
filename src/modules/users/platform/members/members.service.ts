import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { Types } from 'mongoose';

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

  public async create({ dto }) {
    const member = await this.membersRepository.createOne({ dto });

    if (!member) throw new InternalServerErrorException('members.notCreated');

    return member;
  }

  public async update({ memberId, dto }) {
    const member = await this.membersRepository.updateOne({
      query: { _id: memberId },
      dto,
    });
    if (!member) throw new NotFoundException('members.notUpdated');

    return member;
  }

  public async delete({ memberId }) {
    const item = await this.membersRepository.deleteOne({
      query: { _id: memberId },
    });

    if (!item) throw new NotFoundException('members.notDeleted');

    return item;
  }
}
