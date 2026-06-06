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
        allowedSearchFields: ['name', 'description'],
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
            $lookup: {
              from: 'messages',
              localField: 'message',
              foreignField: '_id',
              as: 'lastReadMessage',
            },
          },
          {
            $unwind: {
              path: '$lastReadMessage',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              space: 1,
              user: 1,
              role: 1,
              lastReadMessage: 1,
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
