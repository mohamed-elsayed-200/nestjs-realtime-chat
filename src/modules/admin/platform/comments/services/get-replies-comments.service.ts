import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CommentsRepository } from '../../../../../common/modules/platform/comments/comments.repository';

@Injectable()
export class GetRepliesCommentsService {
  constructor(private readonly commentsRepository: CommentsRepository) {}
  public async getReplies({ query, parentId, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
    const parentObjectId = new Types.ObjectId(parentId);
    return this.commentsRepository.findAll({
      query,
      options: {
        pipelines: [
          { $match: { parent: parentObjectId } },
          {
            $lookup: {
              from: 'users',
              localField: 'author',
              foreignField: '_id',
              as: 'author',
              pipeline: [
                {
                  $project: {
                    name: 1,
                    username: 1,
                    profileColor: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
          // Lookup reactions for this comment
          {
            $lookup: {
              from: 'reactions',
              let: { commentId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$comment', '$$commentId'] },
                  },
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails',
                  },
                },
                { $unwind: '$userDetails' },
                { $sort: { createdAt: -1 } },
                // Group by emoji
                {
                  $group: {
                    _id: '$emoji',
                    count: { $sum: 1 },
                    users: {
                      $push: {
                        id: '$userDetails._id',
                        name: '$userDetails.name',
                        avatar: '$userDetails.avatar',
                        profileColor: '$userDetails.profileColor',
                      },
                    },
                    // Check if current user reacted with this emoji
                    hasUserReacted: {
                      $sum: {
                        $cond: [
                          { $eq: ['$userDetails._id', userObjectId] },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    emoji: '$_id',
                    count: 1,
                    hasUserReacted: { $gt: ['$hasUserReacted', 0] },
                    recentUsers: { $slice: ['$users', 3] },
                  },
                },
              ],
              as: 'reactions',
            },
          },
          // Convert reactions array to object keyed by emoji
          {
            $addFields: {
              reactionsMap: {
                $arrayToObject: {
                  $map: {
                    input: '$reactions',
                    as: 'reaction',
                    in: {
                      k: '$$reaction.emoji',
                      v: {
                        count: '$$reaction.count',
                        hasUserReacted: '$$reaction.hasUserReacted',
                        recentUsers: '$$reaction.recentUsers',
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              author: 1,
              content: 1,
              parent: 1,
              isEdited: 1,
              editedAt: 1,
              createdAt: 1,
              // Use $ifNull to ensure reactions is always an object, never null
              reactions: { $ifNull: ['$reactionsMap', {}] },
              text: 1,
              space: 1,
              message: 1,
              commentType: 1,
              stickerPack: 1,
              stickerId: 1,
              gifId: 1,
              gifPack: 1,
              duration: 1,
            },
          },
        ],
      },
    });
  }
}
