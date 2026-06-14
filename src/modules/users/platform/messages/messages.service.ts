import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { MessageStatus } from '../../../../common/types/enums';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async getAll({ query, spaceId, authUser }) {
    this.membersRepository.markUnreadCountAsRead({ spaceId, authUser });

    const userId = new Types.ObjectId(authUser?._id);

    return this.messagesRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['text', 'content'],
        pipelines: [
          {
            $match: {
              space: new Types.ObjectId(spaceId),
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
                  $sort: { createdAt: -1 }, // Sort by newest first
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
                        $cond: [{ $eq: ['$userDetails._id', userId] }, 1, 0],
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
                    recentUsers: { $slice: ['$users', 3] }, // Take last 3 users
                  },
                },
              ],
              as: 'reactions',
            },
          },
          {
            $addFields: {
              // Convert reactions array to object format
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
              isOutgoing: {
                $cond: {
                  if: { $eq: ['$sender._id', userId] },
                  then: true,
                  else: false,
                },
              },
              space: 1,
              sender: {
                profileColor: '$sender.profileColor',
                avatar: '$sender.avatar',
                name: '$sender.name',
                _id: '$sender._id',
              },
              text: 1,
              content: 1,
              messageType: 1,
              isEdited: 1,
              metadata: 1,
              mediaUrl: 1,
              replyTo: 1,
              status: 1,
              createdAt: 1,
              reactions: '$reactionsMap',
            },
          },
        ],
      },
    });
  }

  public async getOne({ messageId, authUser }) {
    const message = await this.messagesRepository.findOne({
      query: { _id: messageId },
    });

    if (!message) throw new NotFoundException('messages.notFound');
    return {
      ...message,
      isOutgoing: message.sender?.toString() === authUser?._id?.toString(),
    };
  }

  public async create({ dto, authUser }) {
    const message = await this.messagesRepository.createOne({
      dto: { ...dto, sender: new Types.ObjectId(authUser?._id) },
    });

    if (!message) throw new InternalServerErrorException('messages.notCreated');

    const spaceId = new Types.ObjectId(message.space?.toString());
    const senderId = new Types.ObjectId(authUser?._id);

    await this.membersRepository.updateMany({
      query: {
        space: spaceId,
        user: { $ne: senderId },
      },
      dto: {
        $inc: { unreadCount: 1 },
      },
    });

    await this.spacesRepository.updateOne({
      query: { _id: spaceId },
      dto: {
        lastMessage: {
          _id: new Types.ObjectId(message?._id),
          text: message?.text,
          sender: message?.sender,
          status: MessageStatus.SENT,
          createdAt: new Date(),
        },
      },
    });
    return {
      ...message.toObject(),
      isOutgoing: message.sender?.toString() === authUser?._id?.toString(),
    };
  }

  public async update({ messageId, dto, authUser }) {
    const message = await this.messagesRepository.updateOne({
      query: { _id: messageId, sender: authUser?._id },
      dto: { ...dto, isEdited: true },
    });
    if (!message) throw new NotFoundException('messages.notUpdated');

    await this.spacesRepository.updateOne({
      query: { _id: message.space },
      dto: {
        lastMessage: {
          _id: new Types.ObjectId(message?._id),
          text: message?.text,
          sender: message?.sender,
          status: message?.status,
          isEdited: true,
          createdAt: new Date(),
        },
      },
    });

    return {
      ...message.toObject(),
      isOutgoing: message.sender?.toString() === authUser?._id?.toString(),
    };
  }

  public async delete({ messageId, authUser }) {
    const message = await this.messagesRepository.deleteOne({
      query: { _id: messageId, sender: authUser?._id },
    });

    if (!message) throw new NotFoundException('messages.notDeleted');

    return {
      ...message.toObject(),
      isOutgoing: message.sender?.toString() === authUser?._id?.toString(),
    };
  }
}
