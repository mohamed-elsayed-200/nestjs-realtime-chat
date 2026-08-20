import { Injectable } from '@nestjs/common';
import { BannedRepository } from '../../../../../common/modules/platform/banned/banned.repository';
import { Types } from 'mongoose';

@Injectable()
export class GetBannedUsersService {
  constructor(private readonly bannedRepository: BannedRepository) {}

  public async getBannedUsers({ query, authUser }) {
    return this.bannedRepository.findAll({
      query,
      options: {
        pipelines: [
          { $match: { bannedBy: new Types.ObjectId(authUser._id) } },
          {
            $lookup: {
              from: 'users',
              localField: 'bannedUser',
              foreignField: '_id',
              as: 'userObj',
            },
          },
          { $unwind: '$userObj' },
          {
            $project: {
              _id: '$userObj._id',
              name: '$userObj.name',
              username: '$userObj.username',
              avatar: '$userObj.avatar',
              profileColor: '$userObj.profileColor',
              bannedAt: '$createdAt',
            },
          },
          { $sort: { bannedAt: -1 } },
        ],
      },
    });
  }
}
