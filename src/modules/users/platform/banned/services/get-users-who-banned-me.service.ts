import { Injectable } from '@nestjs/common';
import { BannedRepository } from '../../../../../common/modules/platform/banned/banned.repository';
import { Types } from 'mongoose';

@Injectable()
export class GetUsersWhoBannedMeService {
  constructor(private readonly bannedRepository: BannedRepository) {}

  public async getUsersWhoBannedMe({ query, authUser }) {
    return this.bannedRepository.findAll({
      query,
      options: {
        pipelines: [
          { $match: { bannedUser: new Types.ObjectId(authUser._id) } },
          {
            $lookup: {
              from: 'users',
              localField: 'bannedBy',
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
            },
          },
        ],
      },
    });
  }
}
