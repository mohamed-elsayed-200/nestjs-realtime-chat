import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { SpaceHistory, SpaceTypes } from '../../../../../common/types/enums';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class GetMessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async get({ query, spaceId, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
    let spaceObjectId = new Types.ObjectId(spaceId);
    const findMember = await this.membersRepository.findOne({
      query: {
        user: userObjectId,
        space: new Types.ObjectId(spaceId),
        isBanned: false,
      },
    });
    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });

    let hideMessagesFromDate: Date | null = null;
    let blockAllMessages = false;

    const isChannel = findSpace?.type === SpaceTypes.CHANNEL;
    const isPrivate = findSpace?.type === SpaceTypes.PRIVATE;

    if (isChannel) {
      const settings = findSpace?.settings?.channel;
      const hideMessages = settings?.spaceHistory === SpaceHistory.HIDDEN;
      if (hideMessages) {
        if (findMember?.joinedAt) {
          hideMessagesFromDate = findMember?.joinedAt;
        } else {
          blockAllMessages = true;
        }
      }
    }

    if (blockAllMessages) {
      return this.messagesRepository.findAll({
        query,
        options: {
          allowedSearchFields: ['text', 'content'],
          allowedFilterFields: [
            'isPinned',
            'messageType',
            'isEdited',
            'sender',
            'createdAt',
          ],
          pipelines: [
            {
              $match: {
                _id: { $exists: false },
              },
            },
          ],
        },
      });
    }

    return this.messagesRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['text', 'content'],
        allowedFilterFields: [
          'isPinned',
          'messageType',
          'isEdited',
          'sender',
          'createdAt',
        ],
        pipelines: [
          {
            $match: {
              space: spaceObjectId,
              deletedFrom: { $ne: userObjectId },
              ...(hideMessagesFromDate && {
                createdAt: { $gte: hideMessagesFromDate },
              }),
              ...(isPrivate &&
                findMember?.deletedAt && {
                  createdAt: { $gt: findMember.deletedAt },
                }),
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'sender',
              foreignField: '_id',
              as: 'sender',
            },
          },
          {
            $unwind: {
              path: '$sender',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $lookup: {
              from: 'banneds',
              let: { senderId: '$sender._id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$bannedBy', '$$senderId'] },
                        { $eq: ['$bannedUser', userObjectId] },
                      ],
                    },
                  },
                },
                { $project: { _id: 1 } },
              ],
              as: 'senderBlockDoc',
            },
          },
          {
            $addFields: {
              senderHasBlockedMe: { $gt: [{ $size: '$senderBlockDoc' }, 0] },
            },
          },

          {
            $lookup: {
              from: 'messages',
              localField: 'replyTo',
              foreignField: '_id',
              as: 'replyTo',
            },
          },
          {
            $unwind: {
              path: '$replyTo',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'replyTo.sender',
              foreignField: '_id',
              as: 'replyTo.sender',
            },
          },
          {
            $unwind: {
              path: '$replyTo.sender',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'forwardFrom',
              foreignField: '_id',
              as: 'forwardFrom',
            },
          },
          {
            $unwind: {
              path: '$forwardFrom',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'members',
              let: { senderId: '$sender._id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$user', '$$senderId'] },
                        { $eq: ['$space', spaceObjectId] },
                      ],
                    },
                  },
                },
              ],
              as: 'member',
            },
          },
          {
            $unwind: {
              path: '$member',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'reactions',
              let: { messageId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$message', '$$messageId'] },
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
                {
                  $unwind: '$userDetails',
                },
                {
                  $sort: { createdAt: -1 },
                },
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
              space: 1,
              text: 1,
              content: 1,
              messageType: 1,
              isEdited: 1,
              metadata: 1,
              mediaUrl: 1,
              status: 1,
              createdAt: 1,
              reactions: '$reactionsMap',
              isPinned: 1,
              commentsCount: 1,
              viewCount: 1,
              audioLevels: 1,
              duration: 1,
              isOutgoing: {
                $cond: {
                  if: { $eq: ['$sender._id', userObjectId] },
                  then: true,
                  else: false,
                },
              },
              sender: {
                _id: '$sender._id',
                profileColor: '$sender.profileColor',
                avatar: {
                  $cond: {
                    if: '$senderHasBlockedMe',
                    then: null,
                    else: '$sender.avatar',
                  },
                },
                name: '$sender.name',
                adminTag: '$member.adminTag',
                adminTagColor: '$member.adminTagColor',
                theyBlockedMe: '$senderHasBlockedMe',
              },
              forwardFrom: {
                $cond: {
                  if: { $ifNull: ['$forwardFrom', null] },
                  then: {
                    _id: '$forwardFrom._id',
                    name: '$forwardFrom.name',
                    avatar: '$forwardFrom.avatar',
                    profileColor: '$forwardFrom.profileColor',
                  },
                  else: null,
                },
              },
              replyTo: {
                $cond: {
                  if: { $ifNull: ['$replyTo', null] },
                  then: {
                    _id: '$replyTo._id',
                    text: '$replyTo.text',
                    content: '$replyTo.content',
                    messageType: '$replyTo.messageType',
                    sender: {
                      profileColor: '$replyTo.sender.profileColor',
                      avatar: '$replyTo.sender.avatar',
                      name: '$replyTo.sender.name',
                      _id: '$replyTo.sender._id',
                    },
                    isOutgoing: {
                      $cond: {
                        if: { $eq: ['$replyTo.sender._id', userObjectId] },
                        then: true,
                        else: false,
                      },
                    },
                  },
                  else: null,
                },
              },
            },
          },
        ],
      },
    });
  }
}
