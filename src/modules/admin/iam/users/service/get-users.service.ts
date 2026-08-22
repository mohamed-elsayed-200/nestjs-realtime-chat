import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';

@Injectable()
export class GetUsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async get({ query }) {
    return this.usersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'email'],
        allowedFilterFields: ['status', 'userType', 'role', 'permissions'],
        pipelines: [
          {
            $lookup: {
              from: 'members',
              localField: '_id',
              foreignField: 'user',
              as: 'userMemberships',
            },
          },

          {
            $lookup: {
              from: 'spaces',
              let: { spaceIds: '$userMemberships.space' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ['$_id', { $ifNull: ['$$spaceIds', []] }],
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    privateCount: {
                      $sum: { $cond: [{ $eq: ['$type', 'PRIVATE'] }, 1, 0] },
                    },
                    groupCount: {
                      $sum: { $cond: [{ $eq: ['$type', 'GROUP'] }, 1, 0] },
                    },
                    channelCount: {
                      $sum: { $cond: [{ $eq: ['$type', 'CHANNEL'] }, 1, 0] },
                    },
                    communityCount: {
                      $sum: { $cond: [{ $eq: ['$type', 'COMMUNITY'] }, 1, 0] },
                    },
                  },
                },
              ],
              as: 'spaceStats',
            },
          },

          {
            $lookup: {
              from: 'calls',
              let: { userId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $or: [
                        { $eq: ['$caller', '$$userId'] },
                        { $eq: ['$receiver', '$$userId'] },
                        { $eq: ['$createdBy', '$$userId'] },
                      ],
                    },
                  },
                },
                { $count: 'total' },
              ],
              as: 'callStats',
            },
          },

          {
            $addFields: {
              spaceStatsDoc: { $arrayElemAt: ['$spaceStats', 0] },
              callStatsDoc: { $arrayElemAt: ['$callStats', 0] },
            },
          },

          {
            $addFields: {
              privatesCount: {
                $ifNull: ['$spaceStatsDoc.privateCount', 0],
              },
              groupsCount: { $ifNull: ['$spaceStatsDoc.groupCount', 0] },
              channelsCount: {
                $ifNull: ['$spaceStatsDoc.channelCount', 0],
              },
              communitiesCount: {
                $ifNull: ['$spaceStatsDoc.communityCount', 0],
              },
              callsCount: { $ifNull: ['$callStatsDoc.total', 0] },
            },
          },

          {
            $project: {
              userMemberships: 0,
              spaceStats: 0,
              callStats: 0,
              spaceStatsDoc: 0,
              callStatsDoc: 0,
            },
          },

          {
            $project: {
              name: 1,
              email: 1,
              username: 1,
              avatar: 1,
              status: 1,
              userType: 1,
              roles: 1,
              is2FA: 1,
              lastLoginAt: 1,
              profileColor: 1,
              createdAt: 1,
              privatesCount: 1,
              groupsCount: 1,
              channelsCount: 1,
              communitiesCount: 1,
              callsCount: 1,
            },
          },
        ],
      },
    });
  }
}
