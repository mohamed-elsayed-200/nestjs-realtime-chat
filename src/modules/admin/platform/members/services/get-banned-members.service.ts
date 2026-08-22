import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class GetBannedMembersService {
  constructor(private readonly membersRepository: MembersRepository) {}

  public async get({ query, spaceId, authUser }) {
    const userObjectId = new Types.ObjectId(authUser._id);

    return this.membersRepository.findAll({
      query,
      options: {
        pipelines: [
          {
            $match: {
              space: new Types.ObjectId(spaceId),
              isBanned: true,
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
              from: 'banneds',
              let: { memberId: '$user._id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$bannedBy', '$$memberId'] },
                        { $eq: ['$bannedUser', userObjectId] },
                      ],
                    },
                  },
                },
                { $project: { _id: 1 } },
              ],
              as: 'memberBlockDoc',
            },
          },
          {
            $addFields: {
              memberHasBlockedMe: { $gt: [{ $size: '$memberBlockDoc' }, 0] },
            },
          },

          {
            $project: {
              id: 1,
              bannedAt: 1,
              user: {
                id: '$user._id',
                name: '$user.name',
                username: '$user.username',
                profileColor: '$user.profileColor',
                avatar: {
                  $cond: {
                    if: '$memberHasBlockedMe',
                    then: null,
                    else: '$user.avatar',
                  },
                },
                theyBlockedMe: '$memberHasBlockedMe',
              },
            },
          },
        ],
      },
    });
  }
}
