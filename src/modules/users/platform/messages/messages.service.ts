import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import {
  MessageStatus,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../common/types/enums';
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
              isOutgoing: {
                $cond: {
                  if: { $eq: ['$sender._id', userId] },
                  then: true,
                  else: false,
                },
              },
              sender: {
                profileColor: '$sender.profileColor',
                avatar: '$sender.avatar',
                name: '$sender.name',
                _id: '$sender._id',
              },
              forwardFrom: {
                $cond: {
                  if: { $ifNull: ['$forwardFrom', false] },
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
                  if: { $ifNull: ['$replyTo', false] },
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
                        if: { $eq: ['$replyTo.sender._id', userId] },
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
  public async delete({ dto, authUser }) {
    const { messageIds } = dto;
    const userId = new Types.ObjectId(authUser?._id);

    // Get messages BEFORE deleting
    const messagesToDelete = await this.messagesRepository.findMany({
      query: {
        _id: { $in: messageIds },
        sender: userId,
      },
    });

    if (messagesToDelete.length === 0) {
      throw new NotFoundException('messages.notFound');
    }

    // Extract unique space IDs
    const uniqueSpaceIds = [
      ...new Set(messagesToDelete.map((msg) => msg.space.toString())),
    ];

    // Delete messages
    const result = await this.messagesRepository.deleteMany({
      query: {
        _id: { $in: messageIds },
        sender: userId,
      },
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('messages.notDeleted');
    }

    // Update lastMessage for each space and collect results
    const updatedSpaces = [];

    for (const spaceId of uniqueSpaceIds) {
      const lastMessage: any = await this.messagesRepository.findOne({
        query: {
          space: new Types.ObjectId(spaceId),
          isDeleted: { $ne: true },
        },
        sort: { createdAt: -1 },
      });

      await this.spacesRepository.updateOne({
        query: { _id: spaceId },
        dto: {
          lastMessage: lastMessage
            ? {
                _id: lastMessage._id,
                text: lastMessage.text,
                sender: lastMessage.sender,
                status: lastMessage.status,
                createdAt: lastMessage.createdAt,
              }
            : null,
        },
      });

      updatedSpaces.push({
        spaceId,
        lastMessage: lastMessage,
      });
    }
    const lastMessage = updatedSpaces[0]?.lastMessage;
    const processLastMessage = {
      ...lastMessage,
      isOutgoing: lastMessage?.sender?.toString() === authUser?._id?.toString(),
    };
    return {
      deletedCount: result.deletedCount,
      lastMessage: processLastMessage,
    };
  }
  public async forward({ dto, authUser }) {
    const { messageIds, targetSpaceId } = dto;
    const userId = new Types.ObjectId(authUser?._id);

    // Check if user is a member of target space
    const findMember: any = await this.membersRepository.findOne({
      query: {
        user: userId,
        space: new Types.ObjectId(targetSpaceId),
      },
      populate: [
        {
          path: 'space',
          model: 'Space',
          select: 'status type',
        },
      ],
    });

    if (!findMember) throw new NotFoundException('spaces.notFound');

    // Channel: only admins and moderators can forward
    if (
      findMember.space.type === SpaceTypes.CHANNEL &&
      findMember.role === SpaceMemberRole.MEMBER
    ) {
      throw new ForbiddenException('channels.onlyAdminsCanForward');
    }

    // Rest of your code...
    const originalMessages = await this.messagesRepository.findMany({
      query: {
        _id: { $in: messageIds },
      },
    });

    if (originalMessages.length === 0) {
      throw new NotFoundException('messages.notFound');
    }

    const messagesToInsert = originalMessages.map((originalMessage) => ({
      space: new Types.ObjectId(targetSpaceId),
      sender: userId,
      messageType: originalMessage.messageType,
      content: originalMessage.content,
      text: originalMessage.text,
      forwardFrom: originalMessage.sender,
      albumFiles: originalMessage.albumFiles,
      mimeType: originalMessage.mimeType,
      status: MessageStatus.SENT,
      createdAt: new Date(),
    }));

    const forwardedMessages = await this.messagesRepository.insertMany({
      documents: messagesToInsert,
    });

    const lastForwardedMessage =
      forwardedMessages[forwardedMessages.length - 1];

    await this.spacesRepository.updateOne({
      query: { _id: targetSpaceId },
      dto: {
        lastMessage: {
          _id: lastForwardedMessage._id,
          text: lastForwardedMessage.text,
          sender: lastForwardedMessage.sender,
          status: MessageStatus.SENT,
          createdAt: new Date(),
        },
      },
    });

    return;
  }
}
