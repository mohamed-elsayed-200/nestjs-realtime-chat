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
              isPinned: 1,
              commentsCount: 1,
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
    const senderId = new Types.ObjectId(authUser?._id);
    const spaceId = new Types.ObjectId(dto.space);

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });
    if (!space) throw new NotFoundException('spaces.notFoundOne');

    const message = await this.messagesRepository.createOne({
      dto: { ...dto, sender: senderId },
    });
    if (!message) throw new InternalServerErrorException('messages.notCreated');

    const messageObjectId = new Types.ObjectId(message._id.toString());

    // Increment unread count for other participants
    await this.membersRepository.updateMany({
      query: {
        space: spaceId,
        user: { $ne: senderId },
      },
      dto: {
        isDeleted: false,
        $inc: { unreadCount: 1 },
      },
    });

    // Update lastMessage based on space type
    const isPrivate = space.type === SpaceTypes.PRIVATE;
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

    return {
      ...message.toObject(),
      id: message?._id,
      _id: undefined,
      sender: {
        id: authUser?._id,
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

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });
    if (!space) throw new NotFoundException('spaces.notFoundOne');

    const isPrivate = space.type === SpaceTypes.PRIVATE;

    const message = await this.messagesRepository.updateOne({
      query: { _id: dto?.message, sender: senderId },
      dto: { ...dto, isEdited: true },
    });
    if (!message) throw new NotFoundException('messages.notUpdated');

    const messageObjectId = new Types.ObjectId(message._id.toString());

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

    return {
      ...message.toObject(),
      id: message?._id,
      _id: undefined,
    };
  }

  public async delete({ dto, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
    const spaceObjectId = new Types.ObjectId(dto?.space);

    // 1. Get space
    const space = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!space) throw new NotFoundException('spaces.notFoundOne');

    const isPrivate = space.type === SpaceTypes.PRIVATE;

    // 2. Get member (for groups/channels only)
    const member = !isPrivate
      ? await this.membersRepository.findOne({
          query: { space: spaceObjectId, user: userObjectId },
        })
      : null;

    if (!isPrivate && !member) {
      throw new BadRequestException('spaces.notMember');
    }

    // 3. Check permissions
    const canDeleteAny =
      !isPrivate &&
      (member.role === SpaceMemberRole.OWNER ||
        (member.role === SpaceMemberRole.ADMIN &&
          member.permissions?.includes(
            SpaceMemberPermission.DELETE_ANY_MESSAGE,
          )));

    // 4. Find messages
    const messages = await this.messagesRepository.findMany({
      query: {
        _id: { $in: dto?.messages },
        space: spaceObjectId,
        // FIX: If not owner/admin, only fetch user's own messages
        ...(!canDeleteAny && { sender: userObjectId }),
      },
    });

    if (messages.length === 0) throw new NotFoundException('messages.notFound');

    // FIX: Validate that all found messages belong to user (if not owner/admin)
    if (!canDeleteAny) {
      const allBelongToUser = messages.every(
        (msg) => msg.sender?.toString() === userObjectId.toString(),
      );
      if (!allBelongToUser) {
        throw new BadRequestException('messages.notAllowedToDelete');
      }
    }

    const foundIds = messages.map((m) => m._id.toString());

    // 5. Determine delete scope
    const isSenderOfAll = messages.every(
      (msg) => msg.sender?.toString() === userObjectId.toString(),
    );

    // FIX: In group/channel, sender can delete their own messages
    // deleteForAll = true only for owner/admin or sender deleting their own
    const deleteForAll = isPrivate
      ? dto?.everybody && isSenderOfAll
      : canDeleteAny || isSenderOfAll;

    if (deleteForAll && !isPrivate && !canDeleteAny && !isSenderOfAll) {
      throw new BadRequestException('messages.notAllowedToDeleteForEveryone');
    }

    // 6. Get all participants
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

    // 7. Determine target users for deletion
    const deleteTargetIds = deleteForAll ? allParticipantIds : [userObjectId];

    // 8. Perform deletion
    if (isPrivate) {
      // Private: soft delete with deletedFrom (per-user)
      await this.messagesRepository.updateMany({
        query: { _id: { $in: foundIds } },
        dto: {
          $addToSet: { deletedFrom: { $each: deleteTargetIds } },
        },
      });
    } else {
      // FIX: Group/Channel: HARD DELETE (remove completely from DB)
      await this.messagesRepository.deleteMany({
        query: { _id: { $in: foundIds } },
      });
    }

    // 9. Update lastMessage
    if (isPrivate) {
      // Get last visible message for each participant
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

      // Decrement unreadCount only for UNSEEN messages in delete-for-all
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
      // FIX: Group/Channel: update global lastMessage after hard delete
      const lastMsg = await this.messagesRepository.findOne({
        query: { space: spaceObjectId },
        sort: { createdAt: -1 },
      });

      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { lastMessage: lastMsg?._id || null },
      });
    }

    // 10. Return
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
    const { messageIds, targetSpaceId } = dto;
    const userId = new Types.ObjectId(authUser?._id);

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

    if (
      findMember.space.type === SpaceTypes.CHANNEL &&
      findMember.role === SpaceMemberRole.MEMBER
    ) {
      throw new BadRequestException('channels.onlyAdminsCanForward');
    }

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
        lastMessage: new Types.ObjectId(lastForwardedMessage._id?.toString()),
      },
    });

    return forwardedMessages;
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

    // FIX: everybody === false is a purely personal action - it only
    // changes what THIS user sees, so no role/permission check applies
    // (same principle as "delete for me" - anyone can always do it to
    // their own view) and nothing is broadcast to the rest of the space.
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

    // everybody === true (or omitted, for backwards compatibility): shared
    // pin/unpin visible to the whole space - requires the same permission
    // check as before.
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
      everybody: true,
      pinnedIds: messageIdsArray,
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
