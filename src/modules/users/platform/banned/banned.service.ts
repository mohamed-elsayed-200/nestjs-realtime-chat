import { BadRequestException, Injectable } from '@nestjs/common';
import { BannedRepository } from '../../../../common/modules/platform/banned/banned.repository';
import { Types } from 'mongoose';

@Injectable()
export class BannedService {
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
  public async toggleBan({ userId, authUser }) {
    const authUserObjectId = new Types.ObjectId(authUser?._id);
    const userObjectId = new Types.ObjectId(userId);

    if (userObjectId?.toString() === authUserObjectId?.toString()) {
      throw new BadRequestException('blocks.cannotBlockSelf');
    }

    const existing = await this.bannedRepository.findOne({
      query: { bannedBy: authUserObjectId, bannedUser: userObjectId },
    });

    if (existing) {
      await this.bannedRepository.deleteOne({
        query: { bannedBy: authUserObjectId, bannedUser: userObjectId },
      });

      return {
        blocked: false,
        userId: userObjectId,
      };
    }

    await this.bannedRepository.createOne({
      dto: { bannedBy: authUserObjectId, bannedUser: userObjectId },
    });
    return {
      blocked: true,
      userId: userObjectId,
    };
  }

  public async assertNotBlocked({ userA, userB }) {
    const block = await this.bannedRepository.findEitherDirection({
      userA,
      userB,
    });
    if (block) {
      throw new BadRequestException('blocks.userBanned');
    }
    return block;
  }
}
