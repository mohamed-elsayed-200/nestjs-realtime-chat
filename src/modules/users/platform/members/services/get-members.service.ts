import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { SpaceMemberRole } from '../../../../../common/types/enums';

@Injectable()
export class GetMembersService {
  constructor(private readonly membersRepository: MembersRepository) {}

  public async get({ query, spaceId, authUser }) {
    const userObjectId = new Types.ObjectId(authUser._id);
    const spaceObjectId = new Types.ObjectId(spaceId);
    return this.membersRepository.findAll({
      query,
      options: {
        pipelines: [
          {
            $match: {
              space: spaceObjectId,
              isDeleted: false,
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
            $addFields: {
              rolePriority: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$role', SpaceMemberRole.OWNER] },
                      then: 0,
                    },
                    {
                      case: { $eq: ['$role', SpaceMemberRole.ADMIN] },
                      then: 1,
                    },
                    {
                      case: { $eq: ['$role', SpaceMemberRole.MEMBER] },
                      then: 2,
                    },
                  ],
                  default: 3,
                },
              },
            },
          },
          {
            $sort: {
              rolePriority: 1,
              joinedAt: -1,
            },
          },
          {
            $project: {
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
              addedById: '$addedBy',
              bannedById: '$bannedBy',
              promotedById: '$promotedBy',
              role: 1,
              adminTag: 1,
              adminTagColor: 1,
              permissions: 1,
              joinedAt: 1,
            },
          },
        ],
      },
    });
  }
}
