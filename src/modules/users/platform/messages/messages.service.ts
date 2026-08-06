import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import {
  MessageStatus,
  MessageType,
  SpaceHistory,
  SpaceMemberPermission,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../common/types/enums';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { text } from 'stream/consumers';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async getAll({ query, spaceId, authUser }) {
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
          allowedSearchFields: [],
          allowedFilterFields: [],
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
        allowedFilterFields: ['isPinned', 'messageType', 'isEdited', 'sender'],
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
                avatar: '$sender.avatar',
                name: '$sender.name',
                adminTag: '$member.adminTag',
                adminTagColor: '$member.adminTagColor',
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
    const senderObjectId = new Types.ObjectId(authUser?._id);
    const spaceObjectId = new Types.ObjectId(dto.space);

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!space) throw new NotFoundException('spaces.notFoundOne');
    const authMember = await this.membersRepository.findOne({
      query: { user: senderObjectId, space: spaceObjectId },
    });
    if (!authMember) throw new NotFoundException('members.notFoundOne');

    const message: any = await this.messagesRepository.createOne({
      dto: { ...dto, sender: senderObjectId },
    });
    if (!message) throw new InternalServerErrorException('messages.notCreated');

    const messageObjectId = new Types.ObjectId(message._id.toString());

    await this.membersRepository.updateMany({
      query: {
        space: spaceObjectId,
        user: { $ne: senderObjectId },
      },
      dto: {
        isDeleted: false,
        $inc: { unreadCount: 1 },
      },
    });

    const isPrivate = space.type === SpaceTypes.PRIVATE;
    let parentSpace: { id: string; name: string };
    if (isPrivate) {
      await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { lastMessage: messageObjectId },
      });
    } else {
      const updatedSpace = await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { lastMessage: messageObjectId },
      });
      if (updatedSpace && updatedSpace?.parentSpace) {
        const findParentSpace = await this.spacesRepository.findOne({
          query: { _id: updatedSpace?.parentSpace },
        });
        if (!findParentSpace || findParentSpace?.type !== SpaceTypes.COMMUNITY)
          return;

        parentSpace = {
          id: findParentSpace._id.toString(),
          name: updatedSpace.name,
        };
        const msg: any = await this.messagesRepository.createOne({
          dto: {
            ...dto,
            space: findParentSpace?._id,
            text: `${updatedSpace?.name}: ${dto.text}`,
            sender: senderObjectId,
          },
        });

        if (!msg) throw new InternalServerErrorException('messages.notCreated');
        const msgObjectId = new Types.ObjectId(msg._id.toString());

        await this.spacesRepository.updateOne({
          query: { _id: findParentSpace?._id, type: SpaceTypes.COMMUNITY },
          dto: { lastMessage: msgObjectId },
        });
        await this.membersRepository.updateMany({
          query: {
            space: findParentSpace?._id,
            user: { $ne: senderObjectId },
          },
          dto: {
            isDeleted: false,
            $inc: { unreadCount: 1 },
          },
        });
      }
    }

    return {
      ...message.toObject(),
      id: message?._id?.toString(),
      _id: undefined,
      parentSpace,
      replyTo: message?.replyTo?._id
        ? {
            ...message?.toObject()?.replyTo,
            id: message?.replyTo?._id,
            _id: undefined,
            sender: message?.replyTo?.sender
              ? {
                  ...message?.replyTo?.sender.toObject(),
                  id: message?.replyTo?.sender?._id,
                  _id: undefined,
                }
              : message?.replyTo?.sender,
          }
        : undefined,
      sender: {
        id: authUser?._id,
        adminTag: authMember?.adminTag,
        adminTagColor: authMember?.adminTagColor,
        name: authUser?.name,
        username: authUser?.username,
        avatar: authUser?.avatar,
        profileColor: authUser?.profileColor,
      },
    };
  }

  public async update({ dto, authUser }) {
    const senderId = new Types.ObjectId(authUser?._id);

    const existingMessage = await this.messagesRepository.findOne({
      query: { _id: dto?.message, sender: senderId },
    });
    if (!existingMessage) throw new NotFoundException('messages.notFound');

    const spaceId = new Types.ObjectId(existingMessage.space.toString());

    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFoundOne');

    const isPrivate = findSpace.type === SpaceTypes.PRIVATE;

    const message = await this.messagesRepository.updateOne({
      query: { _id: dto?.message, sender: senderId },
      dto: { ...dto, isEdited: true },
    });
    if (!message) throw new NotFoundException('messages.notUpdated');

    const messageObjectId = new Types.ObjectId(message._id.toString());

    if (findSpace?.lastMessage === message?._id) {
      if (isPrivate) {
        await this.membersRepository.updateMany({
          query: { space: spaceId },
          dto: { lastMessage: messageObjectId },
        });
      } else {
        await this.spacesRepository.updateOne({
          query: { _id: spaceId },
          dto: { lastMessage: messageObjectId },
        });
      }
    }

    return {
      ...message.toObject(),
      id: message?._id,
      _id: undefined,
    };
  }

  public async delete({ dto, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
    const spaceObjectId = new Types.ObjectId(dto?.space);

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!space) throw new NotFoundException('spaces.notFoundOne');

    const isPrivate = space.type === SpaceTypes.PRIVATE;

    const member = !isPrivate
      ? await this.membersRepository.findOne({
          query: { space: spaceObjectId, user: userObjectId },
        })
      : null;

    if (!isPrivate && !member) {
      throw new BadRequestException('spaces.notMember');
    }

    const canDeleteAny =
      !isPrivate &&
      (member.role === SpaceMemberRole.OWNER ||
        (member.role === SpaceMemberRole.ADMIN &&
          member.permissions?.includes(
            SpaceMemberPermission.DELETE_ANY_MESSAGE,
          )));

    const messages = await this.messagesRepository.findMany({
      query: {
        _id: { $in: dto?.messages },
        space: spaceObjectId,

        ...(!canDeleteAny && { sender: userObjectId }),
      },
    });

    if (messages.length === 0) throw new NotFoundException('messages.notFound');

    if (!canDeleteAny) {
      const allBelongToUser = messages.every(
        (msg) => msg.sender?.toString() === userObjectId.toString(),
      );
      if (!allBelongToUser) {
        throw new BadRequestException('messages.notAllowedToDelete');
      }
    }

    const foundIds = messages.map((m) => m._id.toString());

    const isSenderOfAll = messages.every(
      (msg) => msg.sender?.toString() === userObjectId.toString(),
    );

    const deleteForAll = isPrivate
      ? dto?.everybody && isSenderOfAll
      : canDeleteAny || isSenderOfAll;

    if (deleteForAll && !isPrivate && !canDeleteAny && !isSenderOfAll) {
      throw new BadRequestException('messages.notAllowedToDeleteForEveryone');
    }

    let allParticipantIds: Types.ObjectId[] = [];
    if (isPrivate) {
      const privateMembers = await this.membersRepository.findMany({
        query: { space: spaceObjectId },
      });
      allParticipantIds = privateMembers.map(
        (m: any) => new Types.ObjectId(String(m.user)),
      );
    } else {
      const spaceMembers = await this.membersRepository.findMany({
        query: { space: spaceObjectId, isBanned: false, isDeleted: false },
      });
      allParticipantIds = spaceMembers.map(
        (m: any) => new Types.ObjectId(String(m.user)),
      );
    }

    const deleteTargetIds = deleteForAll ? allParticipantIds : [userObjectId];

    if (isPrivate) {
      await this.messagesRepository.updateMany({
        query: { _id: { $in: foundIds } },
        dto: {
          $addToSet: { deletedFrom: { $each: deleteTargetIds } },
        },
      });
    } else {
      await this.messagesRepository.deleteMany({
        query: { _id: { $in: foundIds } },
      });
    }

    if (isPrivate) {
      for (const uid of allParticipantIds) {
        const lastMsg = await this.messagesRepository.findOne({
          query: {
            space: spaceObjectId,
            deletedFrom: { $ne: uid },
          },
          sort: { createdAt: -1 },
        });

        await this.membersRepository.updateOne({
          query: { space: spaceObjectId, user: uid },
          dto: { lastMessage: lastMsg?._id || null },
        });
      }

      if (deleteForAll) {
        const unreadDeletedCount = messages.filter(
          (msg) => msg.status === MessageStatus.SENT,
        ).length;

        if (unreadDeletedCount > 0) {
          for (const uid of allParticipantIds) {
            if (uid.toString() !== userObjectId.toString()) {
              await this.membersRepository.updateOne({
                query: { space: spaceObjectId, user: uid },
                dto: { $inc: { unreadCount: -unreadDeletedCount } },
              });
            }
          }
        }
      }
    } else {
      const lastMsg = await this.messagesRepository.findOne({
        query: { space: spaceObjectId },
        sort: { createdAt: -1 },
      });

      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { lastMessage: lastMsg?._id || null },
      });
    }

    const myLastMessage = isPrivate
      ? await this.messagesRepository.findOne({
          query: {
            space: spaceObjectId,
            deletedFrom: { $ne: userObjectId },
          },
          sort: { createdAt: -1 },
        })
      : await this.messagesRepository.findOne({
          query: { space: spaceObjectId },
          sort: { createdAt: -1 },
        });

    return {
      deletedCount: foundIds.length,
      lastMessage: {
        ...myLastMessage,
        id: myLastMessage?._id,
        _id: undefined,
      },
    };
  }

  public async forward({ dto, authUser }) {
    const { messages, targetSpace } = dto;
    const userObjectId = new Types.ObjectId(authUser?._id);
    const targetSpaceObjectId = new Types.ObjectId(targetSpace);

    const findMember: any = await this.membersRepository.findOne({
      query: {
        user: userObjectId,
        space: targetSpaceObjectId,
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

    const isPrivate = findMember.space.type === SpaceTypes.PRIVATE;
    const isAdminOrOwner =
      findMember.role === SpaceMemberRole.ADMIN ||
      findMember.role === SpaceMemberRole.OWNER;

    if (!isPrivate) {
      const canSendMessages = findMember.permissions?.includes(
        SpaceMemberPermission.SEND_MESSAGES,
      );

      if (!canSendMessages && !isAdminOrOwner) {
        throw new BadRequestException('spaces.noPermissionToSendMessages');
      }

      if (
        findMember.space.type === SpaceTypes.CHANNEL &&
        findMember.role === SpaceMemberRole.MEMBER
      ) {
        throw new BadRequestException('channels.onlyAdminsCanForward');
      }
    }

    const originalMessages = await this.messagesRepository.findMany({
      query: {
        _id: { $in: messages },
      },
    });

    if (originalMessages.length === 0) {
      throw new NotFoundException('messages.notFound');
    }

    const messagesToInsert = originalMessages.map((originalMessage) => ({
      space: targetSpaceObjectId,
      sender: userObjectId,
      messageType: originalMessage.messageType,
      content: originalMessage.content,
      text: originalMessage.text,
      forwardFrom: originalMessage.sender,
      albumFiles: originalMessage.albumFiles,
      mimeType: originalMessage.mimeType,
      status: MessageStatus.SENT,
      createdAt: new Date(),
    }));

    const insertedMessages = await this.messagesRepository.insertMany({
      documents: messagesToInsert,
    });

    const lastForwardedMessage = insertedMessages[insertedMessages.length - 1];
    const lastMessageId = new Types.ObjectId(
      lastForwardedMessage._id?.toString(),
    );

    if (isPrivate) {
      await this.membersRepository.updateMany({
        query: { space: targetSpaceObjectId },
        dto: { lastMessage: lastMessageId },
      });
    } else if (findMember?.space?.type !== SpaceTypes.COMMUNITY) {
      await this.spacesRepository.updateOne({
        query: { _id: targetSpaceObjectId },
        dto: { lastMessage: lastMessageId },
      });
    }

    const insertedIds = insertedMessages.map((m) => m._id);
    const forwardedMessages = await this.messagesRepository.findMany({
      query: { _id: { $in: insertedIds } },
      populate: [
        { path: 'sender', model: 'User', select: 'name avatar profileColor' },
        {
          path: 'forwardFrom',
          model: 'User',
          select: 'name avatar profileColor',
        },
      ],
    });

    const format = forwardedMessages.map((msg: any) => {
      msg.id = msg._id?.toString();
      delete msg._id;
      delete msg.__v;

      if (msg.space) {
        msg.space = msg.space?.toString?.() || msg.space;
      }

      if (msg.sender && typeof msg.sender === 'object') {
        const sender =
          typeof msg.sender.toObject === 'function'
            ? msg.sender.toObject()
            : { ...msg.sender };
        sender.id = sender._id?.toString();
        delete sender._id;
        delete sender.__v;
        msg.sender = sender;
      }

      if (msg.forwardFrom && typeof msg.forwardFrom === 'object') {
        const forwardFrom =
          typeof msg.forwardFrom.toObject === 'function'
            ? msg.forwardFrom.toObject()
            : { ...msg.forwardFrom };
        forwardFrom.id = forwardFrom._id?.toString();
        delete forwardFrom._id;
        delete forwardFrom.__v;
        msg.forwardFrom = forwardFrom;
      }

      return msg;
    });

    return format;
  }

  public async togglePin({ dto, authUser }) {
    const { messages, space, isPinned, everybody } = dto;
    const userObjectId = new Types.ObjectId(authUser?._id);
    const spaceObjectId = new Types.ObjectId(space);

    const member = await this.membersRepository.findOne({
      query: {
        user: userObjectId,
        space: spaceObjectId,
      },
    });
    if (!member) throw new NotFoundException('members.notFound');

    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFoundOne');

    const isPrivate = findSpace.type === SpaceTypes.PRIVATE;

    const messageIdsArray = Array.isArray(messages) ? messages : [messages];
    const messageObjectIds = messageIdsArray.map(
      (id) => new Types.ObjectId(id),
    );

    if (everybody === false) {
      const update = isPinned
        ? { $addToSet: { pinnedFor: userObjectId } }
        : { $pull: { pinnedFor: userObjectId } };

      const result = await this.messagesRepository.updateMany({
        query: { _id: { $in: messageObjectIds }, space: spaceObjectId },
        dto: update,
      });

      if (result.modifiedCount === 0) {
        throw new InternalServerErrorException('messages.notUpdated');
      }

      return {
        everybody: false,
        pinnedIds: messageIdsArray,
        systemMessage: null,
      };
    }

    const canPin =
      isPrivate ||
      member.role === SpaceMemberRole.OWNER ||
      (member.role === SpaceMemberRole.ADMIN &&
        member.permissions?.includes(SpaceMemberPermission.PIN_ANY_MESSAGE));

    if (!canPin) {
      throw new BadRequestException('messages.notAllowedToPin');
    }

    const result = await this.messagesRepository.updateMany({
      query: { _id: { $in: messageObjectIds }, space: spaceObjectId },
      dto: { isPinned },
    });
    if (result.modifiedCount === 0) {
      throw new InternalServerErrorException('messages.notUpdated');
    }

    const findLastMessage = await this.messagesRepository.findOne({
      query: { _id: messageObjectIds[messageObjectIds?.length - 1] },
    });
    const action = isPinned ? 'pinned' : 'unpinned';
    const messageLabel =
      messageIdsArray.length > 1
        ? `${messageIdsArray.length} messages`
        : `a ${findLastMessage?.content || findLastMessage?.text || 'message'}`;
    const systemText = `${authUser?.name} ${action} ${messageLabel}`;

    const lastMessage = await this.messagesRepository.createOne({
      dto: {
        space: findSpace._id,
        sender: userObjectId,
        messageType: MessageType.SYSTEM,
        status: MessageStatus.SENT,
        content: systemText,
        text: systemText,
      },
    });

    await this.membersRepository.updateMany({
      query: {
        space: spaceObjectId,
        user: { $ne: userObjectId },
      },
      dto: { $inc: { unreadCount: 1 } },
    });

    if (isPrivate) {
      await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { lastMessage: lastMessage._id },
      });
    } else {
      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { lastMessage: lastMessage._id },
      });
    }

    return {
      pinnedObj: {
        everybody: true,
        messages: messageIdsArray,
        isPinned: dto?.isPinned,
        spaceId: spaceObjectId?.toString(),
      },
      systemMessage: {
        ...lastMessage.toObject(),
        id: lastMessage?._id,
        _id: undefined,
        sender: {
          id: authUser?.id,
          name: authUser?.name,
          avatar: authUser?.avatar,
          profileColor: authUser?.profileColor,
        },
      },
    };
  }
}
