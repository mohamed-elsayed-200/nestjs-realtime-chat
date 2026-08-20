import { Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';

@Injectable()
export class GetSubspacesService {
  constructor(private readonly spacesRepository: SpacesRepository) {}

  public async get({ query, spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    const subSpaces = await this.spacesRepository.findAll({
      query: query,
      options: {
        pipelines: [
          {
            $match: {
              parentSpace: spaceObjectId,
            },
          },

          {
            $lookup: {
              from: 'members',
              let: { spaceId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$space', '$$spaceId'] },
                        { $eq: ['$user', userObjectId] },
                        { $eq: ['$isDeleted', false] },
                      ],
                    },
                  },
                },
              ],
              as: 'memberData',
            },
          },

          {
            $unwind: {
              path: '$memberData',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $lookup: {
              from: 'messages',
              localField: 'lastMessage',
              foreignField: '_id',
              as: 'lastMessageData',
            },
          },
          {
            $unwind: {
              path: '$lastMessageData',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'calls',
              let: { spaceId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$space', '$$spaceId'] },
                    status: {
                      $in: ['initiated', 'ringing', 'in-progress'],
                    },
                  },
                },
                { $sort: { createdAt: -1 } },
                { $limit: 1 },
                { $project: { _id: 1, type: 1, status: 1 } },
              ],
              as: 'activeCallData',
            },
          },
          {
            $addFields: {
              activeCall: { $arrayElemAt: ['$activeCallData', 0] },
            },
          },
          {
            $project: {
              _id: 1,
              memberId: '$memberData._id',
              unreadCount: { $ifNull: ['$memberData.unreadCount', 0] },
              isPined: { $ifNull: ['$memberData.isPined', false] },
              isMuted: { $ifNull: ['$memberData.isMuted', false] },
              isArchived: { $ifNull: ['$memberData.isArchived', false] },
              permissions: { $ifNull: ['$memberData.permissions', []] },
              role: { $ifNull: ['$memberData.role', null] },
              folder: { $ifNull: ['$memberData.folder', null] },
              type: 1,
              status: 1,
              name: 1,
              bio: 1,
              avatar: 1,
              profileColor: 1,
              wallpaper: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: ['$wallpaper', null] },
                      { $ne: ['$wallpaper', ''] },
                    ],
                  },
                  then: '$wallpaper',
                  else: { $ifNull: ['$memberData.wallpaper', null] },
                },
              },
              membersCount: 1,
              settings: 1,
              parentSpace: 1,
              createdAt: 1,
              updatedAt: 1,

              lastMessage: {
                $cond: {
                  if: { $ne: ['$lastMessageData', null] },
                  then: {
                    isOutgoing: {
                      $eq: ['$lastMessageData.sender', userObjectId],
                    },
                    id: '$lastMessageData._id',
                    status: '$lastMessageData.status',
                    text: '$lastMessageData.text',
                    createdAt: '$lastMessageData.createdAt',
                  },
                  else: null,
                },
              },

              isActiveCall: { $gt: [{ $size: '$activeCallData' }, 0] },
              activeCallType: { $ifNull: ['$activeCall.type', null] },
              activeCallId: { $ifNull: ['$activeCall._id', null] },
            },
          },

          { $sort: { isPined: -1, updatedAt: -1 } },
        ],
      },
    });

    return subSpaces;
  }
}
