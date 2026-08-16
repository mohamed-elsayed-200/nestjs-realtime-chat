import { Types } from 'mongoose';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { ContactsRepository } from '../../../../common/modules/platform/contacts/contacts.repository';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { JoinRequestsRepository } from '../../../../common/modules/platform/join-requests/join-requests.repository';
import { JoinRequestStatus } from './../../../../common/modules/platform/join-requests/join-request.schema';
import { UsersRepository } from './../../../../common/modules/iam/users/users.repository';
import { BannedRepository } from '../../../../common/modules/platform/banned/banned.repository';
import { CallsRepository } from './../../../../common/modules/platform/calls/calls.repository';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivationStatus,
  adminPermissionList,
  CallStatus,
  JoinApproval,
  memberPermissionList,
  MessageStatus,
  MessageType,
  SpaceMemberPermission,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../common/types/enums';

@Injectable()
export class SpacesService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly contactsRepository: ContactsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly joinRequestsRepository: JoinRequestsRepository,
    private readonly callsRepository: CallsRepository,
    private readonly bannedRepository: BannedRepository,
  ) {}

  public async getOne({ spaceOrUserId, authUser }) {
    const userId = new Types.ObjectId(authUser._id);
    const spaceId = new Types.ObjectId(spaceOrUserId);

    const member = await this.membersRepository.findOne({
      query: { space: spaceId, user: userId },
    });

    const isMember = Boolean(member?._id);

    const findSpace: any = await this.spacesRepository.findOne({
      query: { _id: spaceId },
      populate: [
        {
          path: 'createdBy',
          model: 'User',
          select: 'name avatar profileColor username',
        },
        {
          path: 'sender',
          select: '_id name username avatar profileColor bio',
        },
        {
          path: 'received',
          select: '_id name username avatar profileColor bio',
        },
        {
          path: 'senderContact',
          select: '_id name avatar profileColor',
        },
        {
          path: 'receivedContact',
          select: '_id name avatar profileColor',
        },
      ],
    });

    if (findSpace) {
      const isPrivate = findSpace?.type === SpaceTypes.PRIVATE;

      const activeCall = await this.callsRepository.findOne({
        query: {
          space: spaceId,
          status: {
            $in: [
              CallStatus.INITIATED,
              CallStatus.RINGING,
              CallStatus.IN_PROGRESS,
            ],
          },
        },
      });

      const effectiveLastMessageId = isPrivate
        ? member?.lastMessage
        : findSpace?.lastMessage;

      let lastMessageData = null;
      if (effectiveLastMessageId) {
        lastMessageData = await this.messagesRepository.findOne({
          query: { _id: effectiveLastMessageId },
          select: '_id sender status text createdAt',
        });
      }

      let userContact = null;
      let otherParty = null;
      let iBlockedThem = false;
      let theyBlockedMe = false;

      if (isPrivate) {
        if (findSpace?.sender?._id.toString() === userId.toString()) {
          otherParty = findSpace?.received;
        } else {
          otherParty = findSpace?.sender;
        }

        userContact = await this.contactsRepository.findOne({
          query: {
            me: userId,
            contact: otherParty?._id,
          },
          select: '_id name avatar profileColor',
        });

        if (otherParty?._id) {
          const result = await this.bannedRepository.findBothDirections({
            userA: userId.toString(), // me
            userB: otherParty._id.toString(), // he
          });
          iBlockedThem = Boolean(result.iBlockedThem);
          theyBlockedMe = Boolean(result.theyBlockedMe);
        }
      }

      const dataMember = isMember
        ? {
            unreadCount: member?.unreadCount,
            isPined: member?.isPined,
            isMuted: member?.isMuted,
            isArchived: member?.isArchived,
            folder: member?.folder,
            role: member?.role,
            permissions: member?.permissions,
            joinedAt: member?.joinedAt,
            isBanned: member?.isBanned,
            bannedAt: member?.bannedAt,
            isDeleted: member?.isDeleted,
            adminTag: member?.adminTag,
            adminTagColor: member?.adminTagColor,
            received: isPrivate
              ? {
                  id: otherParty?._id,
                  name: otherParty?.name,
                  username: otherParty?.username,
                  avatar: theyBlockedMe ? null : otherParty?.avatar,
                  profileColor: otherParty?.profileColor,
                  bio: otherParty?.bio,
                }
              : null,

            lastMessage: lastMessageData
              ? {
                  isOutgoing:
                    lastMessageData.sender?._id?.toString() ===
                    userId.toString(),
                  id: lastMessageData._id,
                  status: lastMessageData.status,
                  text: lastMessageData.text,
                  createdAt: lastMessageData.createdAt,
                }
              : null,
          }
        : {};

      const response = {
        id: findSpace?._id,
        type: findSpace?.type,
        status: findSpace?.status,
        createdAt: findSpace?.createdAt,
        updatedAt: findSpace?.updatedAt,
        membersCount: findSpace?.membersCount,
        channelsCount: findSpace?.channelsCount,
        groupsCount: findSpace?.groupsCount,
        parentSpace: findSpace?.parentSpace,
        settings: findSpace?.settings,
        bio: findSpace?.bio || otherParty?.bio,
        createdBy: findSpace?.createdBy,
        wallpaper: findSpace?.wallpaper || member?.wallpaper,
        isActiveCall: Boolean(activeCall),
        activeCallType: activeCall?.type ?? null,
        activeCallId: activeCall?._id?.toString() ?? null,

        name: isPrivate
          ? userContact?.name || otherParty?.name || null
          : findSpace?.name,

        avatar: isPrivate
          ? theyBlockedMe
            ? null
            : userContact?.avatar || otherParty?.avatar || null
          : findSpace?.avatar,

        profileColor: isPrivate
          ? userContact?.profileColor || otherParty?.profileColor || null
          : findSpace?.profileColor,

        isContact: isPrivate ? !!userContact : false,
        iBlockedThem: isPrivate ? iBlockedThem : false,
        theyBlockedMe: isPrivate ? theyBlockedMe : false,

        ...dataMember,
      };

      return response;
    } else {
      const user = await this.usersRepository.findOne({
        query: { _id: spaceId },
      });

      const findContact = await this.contactsRepository.findOne({
        query: {
          me: userId,
          contact: user?._id,
        },
        select: '_id name avatar profileColor',
      });

      let iBlockedThem = false;
      let theyBlockedMe = false;

      if (user?._id) {
        const result = await this.bannedRepository.findBothDirections({
          userA: userId.toString(), // me
          userB: user._id.toString(), // he
        });
        iBlockedThem = Boolean(result.iBlockedThem);
        theyBlockedMe = Boolean(result.theyBlockedMe);
      }

      const response = {
        id: user?._id,
        unreadCount: 0,
        isPined: false,
        isMuted: false,
        isArchived: false,
        type: SpaceTypes.PRIVATE,
        bio: user?.bio,
        name: findContact?.name || user?.name,
        username: user?.username,
        avatar: theyBlockedMe ? null : findContact?.avatar || user?.avatar,
        profileColor: findContact?.profileColor || user?.profileColor,
        isContact: findContact?._id ? true : false,
        iBlockedThem,
        theyBlockedMe,
        isActiveCall: false,
        activeCallType: null,
        activeCallId: null,

        received: {
          id: user?._id,
          name: findContact?.name || user?.name,
          avatar: theyBlockedMe ? null : findContact?.avatar || user?.avatar,
          profileColor: findContact?.profileColor || user?.profileColor,
          username: user?.username,
          bio: user?.bio,
        },
      };

      return response;
    }
  }

  public async getAll({ query, authUser }) {
    const userId = new Types.ObjectId(authUser._id);

    const spaces = await this.membersRepository.findAll({
      query: query,
      options: {
        allowedSearchFields: ['name', 'bio'],
        allowedFilterFields: ['status', 'type', 'archive'],
        pipelines: [
          {
            $match: {
              user: userId,
              isDeleted: false,
            },
          },

          {
            $lookup: {
              from: 'spaces',
              localField: 'space',
              foreignField: '_id',
              as: 'space',
            },
          },
          { $unwind: '$space' },

          {
            $match: {
              $or: [
                { 'space.parentSpace': { $exists: false } },
                { 'space.parentSpace': null },
              ],
            },
          },

          {
            $lookup: {
              from: 'users',
              let: {
                senderId: '$space.sender',
                receivedId: '$space.received',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $or: [
                        { $eq: ['$_id', '$$senderId'] },
                        { $eq: ['$_id', '$$receivedId'] },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    username: 1,
                    avatar: 1,
                    profileColor: 1,
                    bio: 1,
                  },
                },
              ],
              as: 'spaceUsers',
            },
          },

          {
            $lookup: {
              from: 'contacts',
              let: {
                spaceSender: '$space.sender',
                spaceReceived: '$space.received',
                userId: userId,
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$me', '$$userId'] },
                        {
                          $or: [
                            { $eq: ['$contact', '$$spaceReceived'] },
                            { $eq: ['$contact', '$$spaceSender'] },
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    avatar: 1,
                    profileColor: 1,
                  },
                },
              ],
              as: 'userContacts',
            },
          },

          {
            $addFields: {
              myContactId: {
                $cond: {
                  if: { $eq: [userId, '$space.sender'] },
                  then: '$space.senderContact',
                  else: '$space.receivedContact',
                },
              },
            },
          },
          {
            $lookup: {
              from: 'contacts',
              let: {
                myContactId: '$myContactId',
              },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$_id', '$$myContactId'] },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    avatar: 1,
                    profileColor: 1,
                  },
                },
              ],
              as: 'spaceContacts',
            },
          },

          {
            $addFields: {
              otherParty: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$spaceUsers',
                      as: 'user',
                      cond: {
                        $ne: ['$$user._id', userId],
                      },
                    },
                  },
                  0,
                ],
              },
              userContact: { $arrayElemAt: ['$userContacts', 0] },
              spaceContact: { $arrayElemAt: ['$spaceContacts', 0] },
            },
          },

          // جديد: هات الـ banned documents في الاتجاهين بيني وبين otherParty
          {
            $lookup: {
              from: 'banneds', // تأكد من اسم الـ collection الفعلي عندك (راجع ملحوظة تحت)
              let: { otherPartyId: '$otherParty._id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $or: [
                        {
                          $and: [
                            { $eq: ['$bannedBy', userId] },
                            { $eq: ['$bannedUser', '$$otherPartyId'] },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ['$bannedBy', '$$otherPartyId'] },
                            { $eq: ['$bannedUser', userId] },
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  $project: { _id: 1, bannedBy: 1, bannedUser: 1 },
                },
              ],
              as: 'blockDocs',
            },
          },
          {
            $addFields: {
              iBlockedThem: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$blockDocs',
                        as: 'b',
                        cond: { $eq: ['$$b.bannedBy', userId] },
                      },
                    },
                  },
                  0,
                ],
              },
              theyBlockedMe: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$blockDocs',
                        as: 'b',
                        cond: { $ne: ['$$b.bannedBy', userId] },
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },

          {
            $addFields: {
              resolvedAvatar: {
                $cond: {
                  if: '$theyBlockedMe',
                  then: null,
                  else: {
                    $ifNull: [
                      '$userContact.avatar',
                      {
                        $ifNull: ['$spaceContact.avatar', '$otherParty.avatar'],
                      },
                    ],
                  },
                },
              },
              resolvedName: {
                $ifNull: [
                  '$userContact.name',
                  { $ifNull: ['$spaceContact.name', '$otherParty.name'] },
                ],
              },
              resolvedProfileColor: {
                $ifNull: [
                  '$userContact.profileColor',
                  {
                    $ifNull: [
                      '$spaceContact.profileColor',
                      '$otherParty.profileColor',
                    ],
                  },
                ],
              },
            },
          },

          {
            $addFields: {
              effectiveLastMessageId: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$lastMessage',
                  else: '$space.lastMessage',
                },
              },
            },
          },

          {
            $lookup: {
              from: 'messages',
              localField: 'effectiveLastMessageId',
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
              let: { spaceId: '$space._id' },
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
                {
                  $project: {
                    _id: 1,
                    type: 1,
                    status: 1,
                  },
                },
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
              _id: '$space._id',
              unreadCount: 1,
              isPined: 1,
              isMuted: 1,
              isArchived: 1,
              adminTag: 1,
              adminTagColor: 1,
              permissions: 1,
              role: 1,
              folder: { $ifNull: ['$folder', null] },

              channelsCount: '$space.channelsCount',
              groupsCount: '$space.groupsCount',
              membersCount: '$space.membersCount',
              type: '$space.type',
              status: '$space.status',
              createdAt: '$space.createdAt',
              updatedAt: '$space.updatedAt',
              settings: '$space.settings',

              lastMessage: {
                $cond: {
                  if: { $ne: ['$lastMessageData', null] },
                  then: {
                    isOutgoing: { $eq: ['$lastMessageData.sender', userId] },
                    id: '$lastMessageData._id',
                    status: '$lastMessageData.status',
                    text: '$lastMessageData.text',
                    createdAt: '$lastMessageData.createdAt',
                  },
                  else: null,
                },
              },

              isContact: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: { $gt: [{ $size: '$userContacts' }, 0] },
                  else: false,
                },
              },

              iBlockedThem: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$iBlockedThem',
                  else: false,
                },
              },
              theyBlockedMe: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$theyBlockedMe',
                  else: false,
                },
              },

              wallpaper: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: ['$space.wallpaper', null] },
                      { $ne: ['$space.wallpaper', ''] },
                    ],
                  },
                  then: '$space.wallpaper',
                  else: '$wallpaper',
                },
              },

              name: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$resolvedName',
                  else: '$space.name',
                },
              },

              avatar: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$resolvedAvatar',
                  else: '$space.avatar',
                },
              },

              profileColor: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: '$resolvedProfileColor',
                  else: '$space.profileColor',
                },
              },

              received: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: {
                    _id: '$otherParty._id',
                    name: '$resolvedName',
                    username: '$otherParty.username',
                    avatar: '$resolvedAvatar',
                    profileColor: '$resolvedProfileColor',
                    bio: '$otherParty.bio',
                  },
                  else: null,
                },
              },

              isActiveCall: { $gt: [{ $size: '$activeCallData' }, 0] },
              activeCallType: { $ifNull: ['$activeCall.type', null] },
              activeCallId: { $ifNull: ['$activeCall._id', null] },
            },
          },
        ],
      },
    });

    return spaces;
  }

  public async getSubSpaces({ query, spaceId, authUser }) {
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

  public async openLink({ dto, authUser }) {
    const { linkText, linkType } = dto;
    let query: any = {};

    if (linkType === SpaceTypes.CHANNEL) {
      query = { 'settings.channel.channelLink': linkText };
    } else if (linkType === SpaceTypes.GROUP) {
      query = { 'settings.group.groupLink': linkText };
    } else if (linkType === SpaceTypes.COMMUNITY) {
      query = { 'settings.community.communityLink': linkText };
    } else {
      throw new BadRequestException('spaces.invalidLinkType');
    }

    const findSpace = await this.spacesRepository.findOne({ query });
    if (!findSpace)
      return {
        isDeleted: true,
      };

    const spaceId = new Types.ObjectId(findSpace?._id);
    const userId = new Types.ObjectId(authUser?._id);

    const findRequest = await this.joinRequestsRepository.findOne({
      query: { space: spaceId, user: userId },
    });
    const getSpace = await this.getOne({ spaceOrUserId: spaceId, authUser });

    return {
      ...getSpace,
      joinRequest: findRequest || undefined,
    };
  }

  public async changeWallpaper({ spaceId, dto, authUser }) {
    const { wallpaper, everybody } = dto;
    const userObjectId = new Types.ObjectId(authUser._id);
    const spaceObjectId = new Types.ObjectId(spaceId);

    const findMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });

    if (findMember?.space?.toString() !== spaceObjectId?.toString())
      new NotFoundException('spaces.notFoundOne');

    if (everybody) {
      const systemMessage = await this.messagesRepository.createOne({
        dto: {
          space: spaceObjectId,
          sender: userObjectId,
          messageType: MessageType.SYSTEM,
          status: MessageStatus.SENT,
          content: `${authUser?.name} updated the space wallpaper to "${dto?.wallpaper}"`,
          text: `${authUser?.name} updated the space wallpaper to "${dto?.wallpaper}"`,
        },
      });

      const updateSpace = await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: {
          lastMessage: systemMessage?._id,
          wallpaper,
        },
      });

      if (!updateSpace) new InternalServerErrorException('spaces.notUpdated');

      await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { $inc: { unreadCount: 1 } },
      });

      const formatSystemMessage = {
        ...systemMessage.toObject(),
        id: systemMessage?._id?.toString(),
        _id: undefined,
        __v: undefined,
      };

      return {
        ...updateSpace?.toObject(),
        id: updateSpace?._id?.toString(),
        _id: undefined,
        __v: undefined,
        lastMessage: formatSystemMessage,
        isOutgoing:
          systemMessage?.sender?.toString() === userObjectId?.toString(),
      };
    } else {
      const updateWallpaper = await this.membersRepository.updateMany({
        query: { space: spaceObjectId, user: userObjectId },
        dto: { wallpaper },
      });
      if (!updateWallpaper)
        new InternalServerErrorException('spaces.notUpdated');
      return { ...dto, id: spaceId };
    }
  }

  public async togglePin({ spaceId, authUser }) {
    const findMember = await this.membersRepository.findOne({
      query: {
        space: new Types.ObjectId(spaceId),
        user: new Types.ObjectId(authUser._id),
      },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const member = await this.membersRepository.updateOne({
      query: {
        space: new Types.ObjectId(spaceId),
        user: new Types.ObjectId(authUser._id),
      },
      dto: { isPined: !findMember.isPined },
    });

    if (!member) throw new InternalServerErrorException('spaces.notUpdated');

    return { isPined: member.isPined };
  }

  public async toggleMute({ spaceId, authUser }) {
    const findMember = await this.membersRepository.findOne({
      query: {
        space: new Types.ObjectId(spaceId),
        user: new Types.ObjectId(authUser._id),
      },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const member = await this.membersRepository.updateOne({
      query: {
        space: new Types.ObjectId(spaceId),
        user: new Types.ObjectId(authUser._id),
      },
      dto: { isMuted: !findMember.isMuted },
    });

    if (!member) throw new InternalServerErrorException('spaces.notUpdated');

    return { isMuted: member.isMuted };
  }

  public async toggleArchive({ spaceId, authUser }) {
    const findMember = await this.membersRepository.findOne({
      query: {
        space: new Types.ObjectId(spaceId),
        user: new Types.ObjectId(authUser._id),
      },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const member = await this.membersRepository.updateOne({
      query: {
        space: new Types.ObjectId(spaceId),
        user: new Types.ObjectId(authUser._id),
      },
      dto: { isArchived: !findMember.isArchived },
    });

    if (!member) throw new InternalServerErrorException('spaces.notUpdated');

    return { isArchived: member.isArchived };
  }

  public async markSpaceAsRead({ spaceId, authUser }) {
    await this.membersRepository.markUnreadCountAsRead({ spaceId, authUser });
  }

  public async createPrivateSpace({ dto, authUser }) {
    const { memberId } = dto;

    const userId = new Types.ObjectId(authUser._id);
    const otherUserId = new Types.ObjectId(memberId);

    const findUser = await this.usersRepository.findOne({
      query: { _id: otherUserId },
      select: 'name profileColor avatar username bio',
    });

    if (!findUser)
      throw new InternalServerErrorException('spaces.memberNotFound');

    const existingSpace = await this.spacesRepository.findOne({
      query: {
        type: SpaceTypes.PRIVATE,
        $or: [
          { sender: userId, received: otherUserId },
          { sender: otherUserId, received: userId },
        ],
      },
    });

    if (existingSpace) {
      await this.membersRepository.updateOne({
        query: {
          space: existingSpace._id,
          user: userId,
        },
        dto: { isDeleted: false },
      });

      const [senderContact, receivedContact] = await Promise.all([
        this.contactsRepository.findOne({
          query: { me: userId, contact: otherUserId },
          select: 'name profileColor avatar',
        }),
        this.contactsRepository.findOne({
          query: { me: otherUserId, contact: userId },
          select: 'name profileColor avatar',
        }),
      ]);
      const contactToUse = senderContact || receivedContact;

      return {
        ...existingSpace,
        profileColor: contactToUse?.profileColor ?? findUser.profileColor,
        name: contactToUse?.name ?? findUser.name,
        avatar: contactToUse?.avatar ?? findUser.avatar,
        isContact: !!contactToUse,
        received: {
          _id: findUser._id,
          name: findUser.name,
          profileColor: findUser.profileColor,
          avatar: findUser.avatar,
          username: findUser.username,
        },
      };
    }

    const [senderContact, receivedContact] = await Promise.all([
      this.contactsRepository.findOne({
        query: { me: userId, contact: otherUserId },
        select: 'name profileColor avatar',
      }),
      this.contactsRepository.findOne({
        query: { me: otherUserId, contact: userId },
        select: 'name profileColor avatar',
      }),
    ]);
    const contactToUse = senderContact || receivedContact;

    const space = await this.spacesRepository.createOne({
      dto: {
        status: ActivationStatus.ACTIVE,
        type: SpaceTypes.PRIVATE,
        createdBy: userId,
        sender: userId,
        received: otherUserId,
        senderContact: senderContact?._id || null,
        receivedContact: receivedContact?._id || null,
      },
    });

    if (!space) throw new InternalServerErrorException('spaces.notCreated');

    const members =
      otherUserId.toString() === userId.toString()
        ? [userId]
        : [otherUserId, userId];

    await Promise.all(
      members.map((id) =>
        this.membersRepository.createOne({
          dto: {
            user: id,
            space: new Types.ObjectId(space._id.toString()),
            role:
              id.toString() === userId.toString()
                ? SpaceMemberRole.OWNER
                : SpaceMemberRole.MEMBER,
            joinedAt: new Date(),
            isPined: false,
            isMuted: false,
            isArchived: false,
          },
        }),
      ),
    );

    return {
      ...space.toObject(),
      profileColor: contactToUse?.profileColor ?? findUser.profileColor,
      name: contactToUse?.name ?? findUser.name,
      avatar: contactToUse?.avatar ?? findUser.avatar,
      isContact: !!contactToUse,
      received: {
        _id: findUser._id,
        name: findUser.name,
        profileColor: findUser.profileColor,
        avatar: findUser.avatar,
        username: findUser.username,
      },
    };
  }

  public async createGlobalSpace({ dto, authUser }) {
    const isGroup = dto?.type === SpaceTypes.GROUP;
    const isChannel = dto?.type === SpaceTypes.CHANNEL;
    const isCommunity = dto?.type === SpaceTypes.COMMUNITY;
    const isPrivate = dto?.type === SpaceTypes.PRIVATE;
    const isBot = dto?.type === SpaceTypes.BOT;
    if (isPrivate || isBot)
      throw new NotFoundException('spaces.checkSpaceType');

    if (isGroup && dto?.settings) {
      dto.settings.channel = undefined;
      dto.settings.community = undefined;
    }
    if (isChannel && dto?.settings) {
      dto.settings.group = undefined;
      dto.settings.community = undefined;
    }
    if (isCommunity && dto?.settings) {
      dto.settings.group = undefined;
      dto.settings.channel = undefined;
    }
    let finalSettings = dto?.settings;
    if (isCommunity && finalSettings?.community?.categories?.length > 0) {
      finalSettings = {
        ...finalSettings,
        community: {
          ...finalSettings.community,
          categories: finalSettings.community.categories.map((cat) => ({
            ...cat,
            createdBy: new Types.ObjectId(authUser._id),
          })),
        },
      };
    }

    const members = [
      ...(dto?.members || []).filter((id) => id !== authUser._id.toString()),
      authUser._id.toString(),
    ];

    const newSpace = {
      name: dto?.name,
      bio: dto?.bio,
      avatar: dto?.avatar,
      profileColor: dto?.profileColor || this.usersRepository.getRandomColor(),
      wallpaper: dto?.wallpaper || undefined,
      settings: finalSettings,
      isArchived: false,
      status: ActivationStatus.ACTIVE,
      type: dto?.type,
      createdBy: new Types.ObjectId(authUser._id),
      membersCount: members?.length,
      parentSpace:
        (isGroup || isChannel) && dto?.parentSpace
          ? new Types.ObjectId(dto?.parentSpace)
          : undefined,
    };

    if (newSpace.parentSpace && (isGroup || isChannel)) {
      const parentSpace = await this.spacesRepository.findOne({
        query: { _id: newSpace.parentSpace },
      });

      if (!parentSpace) throw new NotFoundException('spaces.parentNotFound');

      if (parentSpace.type === SpaceTypes.COMMUNITY) {
        const parentMember = await this.membersRepository.findOne({
          query: {
            user: new Types.ObjectId(authUser._id),
            space: newSpace.parentSpace,
          },
        });

        if (!parentMember)
          throw new BadRequestException('spaces.noPermissionToAddSpace');

        const isOwner = parentMember.role === SpaceMemberRole.OWNER;
        const isAdmin = parentMember.role === SpaceMemberRole.ADMIN;

        if (!isOwner) {
          if (!isAdmin) {
            throw new BadRequestException('spaces.noPermissionToAddSpace');
          }

          const hasAddSpacePermission = parentMember.permissions?.includes(
            SpaceMemberPermission.ADD_SPACES_IN_COMMUNITY,
          );

          if (!hasAddSpacePermission) {
            throw new BadRequestException('spaces.noPermissionToAddSpace');
          }
        }
      }
    }

    const linkToCheck = isChannel
      ? dto?.settings?.channel?.channelLink
      : isGroup
        ? dto?.settings?.group?.groupLink
        : isCommunity
          ? dto?.settings?.community?.communityLink
          : null;

    if (linkToCheck) {
      const findSpace = await this.spacesRepository.findOne({
        query: {
          $or: [
            { 'settings.channel.channelLink': linkToCheck },
            { 'settings.group.groupLink': linkToCheck },
            { 'settings.community.communityLink': linkToCheck },
          ],
        },
      });

      if (findSpace)
        throw new BadRequestException('spaces.spaceLinkAlreadyUsed');
    }

    const space = await this.spacesRepository.createOne({ dto: newSpace });
    if (!space) throw new InternalServerErrorException('spaces.notCreated');

    if (newSpace.parentSpace && (isGroup || isChannel)) {
      const incField = isChannel ? 'channelsCount' : 'groupsCount';
      await this.spacesRepository.updateOne({
        query: { _id: newSpace.parentSpace },
        dto: { $inc: { [incField]: 1 } },
      });
    }

    await Promise.all(
      members.map((id) =>
        this.membersRepository.createOne({
          dto: {
            user: new Types.ObjectId(id),
            space: new Types.ObjectId(space._id?.toString()),
            role:
              authUser._id.toString() === id
                ? SpaceMemberRole.OWNER
                : SpaceMemberRole.MEMBER,
            permission: [...memberPermissionList, ...adminPermissionList],
            joinedAt: new Date(),
            isPined: false,
            isMuted: false,
            isArchived: false,
            adminTag: authUser._id.toString() === id ? 'Owner' : undefined,
            adminTagColor:
              authUser._id.toString() === id ? '#22c55e' : undefined,
          },
        }),
      ),
    );

    return space;
  }

  public async updateGlobalSpace({ spaceId, dto, authUser }) {
    const isGroup = dto?.type === SpaceTypes.GROUP;
    const isChannel = dto?.type === SpaceTypes.CHANNEL;
    const isCommunity = dto?.type === SpaceTypes.COMMUNITY;
    const isPrivate = dto?.type === SpaceTypes.PRIVATE;
    const isBot = dto?.type === SpaceTypes.BOT;
    if (isPrivate || isBot)
      throw new BadRequestException('spaces.checkSpaceType');

    if (isGroup && dto?.settings) {
      dto.settings.channel = null;
      dto.settings.community = null;
    }
    if (isChannel && dto?.settings) {
      dto.settings.group = null;
      dto.settings.community = null;
    }
    if (isCommunity && dto?.settings) {
      dto.settings.group = null;
      dto.settings.channel = null;
    }

    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser?._id);

    const member = await this.membersRepository.findOne({
      query: {
        user: userObjectId,
        space: spaceObjectId,
      },
    });

    if (!member) throw new NotFoundException('members.notFoundOne');

    const isOwner = member.role === SpaceMemberRole.OWNER;
    const isAdmin = member.role === SpaceMemberRole.ADMIN;

    const canAttempt = isOwner || isAdmin;
    if (!canAttempt)
      throw new InternalServerErrorException('spaces.notUpdated');

    const hasChangeSettings = member.permissions?.includes(
      SpaceMemberPermission.CHANGE_SETTINGS,
    );
    const hasAddSpacesPermission = member.permissions?.includes(
      SpaceMemberPermission.ADD_SPACES_IN_COMMUNITY,
    );
    const hasChangeInfo = member.permissions?.includes(
      SpaceMemberPermission.CHANGE_INFO,
    );

    const INFO_FIELDS = ['name', 'bio', 'avatar', 'profileColor', 'wallpaper'];

    if (!isOwner) {
      const { settings, type, ...rest } = dto ?? {};

      const touchesInfo = Object.keys(rest).some((k) =>
        INFO_FIELDS.includes(k),
      );

      const touchesUnknownTopLevel = Object.keys(rest).some(
        (k) => !INFO_FIELDS.includes(k),
      );

      let touchesCategories = false;
      let touchesOtherSettings = false;

      if (settings) {
        for (const key of Object.keys(settings)) {
          if (key === 'community') {
            const community = settings.community;
            if (community) {
              for (const ck of Object.keys(community)) {
                if (ck === 'categories') touchesCategories = true;
                else touchesOtherSettings = true;
              }
            }
          } else {
            touchesOtherSettings = true;
          }
        }
      }

      if (!hasChangeSettings) {
        if (touchesUnknownTopLevel || touchesOtherSettings) {
          throw new BadRequestException('spaces.noPermissionToUpdateSettings');
        }
        if (touchesCategories && !hasAddSpacesPermission) {
          throw new BadRequestException(
            'spaces.noPermissionToUpdateCategories',
          );
        }
        if (touchesInfo && !hasChangeInfo) {
          throw new BadRequestException('spaces.noPermissionToUpdateInfo');
        }
      }
    }

    const incomingCategories = dto?.settings?.community?.categories;
    if (isCommunity && incomingCategories && incomingCategories.length > 0) {
      dto.settings.community.categories = incomingCategories.map((cat: any) => {
        if (cat.id?.startsWith('temp-') && !cat.createdBy) {
          return { ...cat, createdBy: new Types.ObjectId(authUser._id) };
        }
        return cat;
      });

      if (!isOwner) {
        const existingSpace = await this.spacesRepository.findOne({
          query: { _id: spaceObjectId },
        });
        const existingCats =
          existingSpace?.settings?.community?.categories || [];

        for (const cat of dto.settings.community.categories) {
          if (cat.id?.startsWith('temp-')) continue;

          const existingCat = existingCats.find((c: any) => c.id === cat.id);

          if (existingCat && existingCat.createdBy) {
            const catCreator =
              existingCat.createdBy.toString?.() ||
              existingCat.createdBy?.toString?.() ||
              existingCat.createdBy;

            if (catCreator !== authUser._id.toString()) {
              throw new BadRequestException('spaces.notCategoryCreator');
            }
          }
        }
      }
    }

    const linkToCheck = isChannel
      ? dto?.settings?.channel?.channelLink
      : isGroup
        ? dto?.settings?.group?.groupLink
        : isCommunity
          ? dto?.settings?.community?.communityLink
          : null;

    if (linkToCheck) {
      const findSpace = await this.spacesRepository.findOne({
        query: {
          _id: { $ne: spaceObjectId },
          $or: [
            { 'settings.channel.channelLink': linkToCheck },
            { 'settings.group.groupLink': linkToCheck },
            { 'settings.community.communityLink': linkToCheck },
          ],
        },
      });

      if (findSpace)
        throw new BadRequestException('spaces.spaceLinkAlreadyUsed');
    }

    const { type, ...updateDto } = dto;
    const space = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId, type },
      dto: updateDto,
    });

    if (!space) throw new InternalServerErrorException('spaces.notUpdated');

    if (dto?.wallpaper) {
      const updateWallpaper = await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { wallpaper: dto?.wallpaper, $inc: { unreadCount: 1 } },
      });

      const lastMessage = await this.messagesRepository.createOne({
        dto: {
          space: spaceObjectId,
          sender: userObjectId,
          messageType: MessageType.SYSTEM,
          status: MessageStatus.SENT,
          content: `${authUser?.name} updated the space wallpaper to "${dto?.wallpaper}"`,
          text: `${authUser?.name} updated the space wallpaper to "${dto?.wallpaper}"`,
        },
      });

      const spaceUpdated = await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: {
          lastMessage: lastMessage?._id,
        },
      });

      if (!updateWallpaper)
        new InternalServerErrorException('spaces.notUpdated');

      const systemMessage = {
        ...lastMessage?.toObject(),
        id: lastMessage?._id?.toString(),
        _id: undefined,
        sender: {
          name: authUser?.name,
          id: authUser?.id,
          username: authUser?.username,
          avatar: authUser?.avatar,
          profileColor: authUser?.profileColor,
        },
      };

      return {
        space: {
          ...spaceUpdated?.toObject(),
          id: spaceId,
          lastMessage: systemMessage,
        },
        systemMessage,
      };
    }

    return {
      space: {
        ...space?.toObject(),
        id: space?.id?.toString(),
        _id: undefined,
      },
    };
  }

  public async joinToSpace({ spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    const findSpace: any = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
      populate: [
        {
          path: 'lastMessage',
          model: 'Message',
        },
      ],
    });

    if (!findSpace) throw new NotFoundException('spaces.notFound');
    const isChannel = findSpace?.type === SpaceTypes.CHANNEL;
    const isGroup = findSpace?.type === SpaceTypes.GROUP;
    const isPrivate = findSpace?.type === SpaceTypes.PRIVATE;
    const isBot = findSpace?.type === SpaceTypes.BOT;
    if (isPrivate || isBot)
      throw new BadRequestException('spaces.checkSpaceType');

    const settings = isChannel
      ? findSpace?.settings?.channel
      : findSpace?.settings?.group;
    const inviteOnly = settings?.joinApproval === JoinApproval.INVITE_ONLY;
    const needApproval = settings?.joinApproval === JoinApproval.NEED_APPROVAL;
    const isSecure = inviteOnly || needApproval;
    if (isSecure) throw new BadRequestException('spaces.isSecure');

    if ((isChannel || isGroup) && findSpace.parentSpace) {
      const parentSpaceId = new Types.ObjectId(findSpace.parentSpace);

      const parentSpace = await this.spacesRepository.findOne({
        query: { _id: parentSpaceId },
      });

      if (parentSpace && parentSpace.type === SpaceTypes.COMMUNITY) {
        const existingParentMember = await this.membersRepository.findOne({
          query: { space: parentSpaceId, user: userObjectId },
        });

        if (existingParentMember && existingParentMember.isBanned) {
          throw new BadRequestException('spaces.youAreBanned');
        }

        if (!existingParentMember || existingParentMember.isDeleted) {
          if (existingParentMember) {
            await this.membersRepository.updateOne({
              query: { _id: existingParentMember._id },
              dto: {
                isDeleted: false,
                deletedAt: null,
                role: SpaceMemberRole.MEMBER,
                permission: existingParentMember.permissions?.filter(
                  (perm: string) => memberPermissionList?.includes(perm),
                ),
                joinedAt: new Date(),
              },
            });
          } else {
            await this.membersRepository.createOne({
              dto: {
                user: userObjectId,
                space: parentSpaceId,
                role: SpaceMemberRole.MEMBER,
                joinedAt: new Date(),
                permissions: memberPermissionList,
              },
            });
          }

          await this.spacesRepository.updateOne({
            query: { _id: parentSpaceId },
            dto: { $inc: { membersCount: 1 } },
          });
        }
      }
    }

    const existingMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    if (existingMember && existingMember?.isBanned)
      throw new BadRequestException('spaces.youAreBanned');

    let member: any;
    if (existingMember) {
      member = await this.membersRepository.updateOne({
        query: { _id: existingMember?._id },
        dto: {
          isDeleted: false,
          deletedAt: null,
          role: SpaceMemberRole.MEMBER,
          permission: existingMember?.permissions?.filter((perm) =>
            memberPermissionList?.includes(perm),
          ),
          joinedAt: new Date(),
        },
      });
    } else {
      member = await this.membersRepository.createOne({
        dto: {
          user: userObjectId,
          space: spaceObjectId,
          role: SpaceMemberRole.MEMBER,
          joinedAt: new Date(),
          permissions: memberPermissionList,
        },
      });
    }

    const wasInactive = !existingMember || existingMember.isDeleted;
    let updatedSpace = findSpace;
    if (wasInactive) {
      const s = await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { $inc: { membersCount: 1 } },
      });
      updatedSpace = s?.toObject();
    }

    if (findSpace.type === SpaceTypes.COMMUNITY) {
      const subSpaces = await this.spacesRepository.findLean({
        query: { parentSpace: spaceObjectId },
      });

      await Promise.all(
        subSpaces.map(async (subSpace: any) => {
          const existingSubMember = await this.membersRepository.findOne({
            query: { space: subSpace._id, user: userObjectId },
          });

          if (existingSubMember && existingSubMember.isBanned) return;

          if (existingSubMember) {
            await this.membersRepository.updateOne({
              query: { _id: existingSubMember._id },
              dto: {
                isDeleted: false,
                deletedAt: null,
                role: SpaceMemberRole.MEMBER,
                permission: existingSubMember.permissions?.filter(
                  (perm: string) => memberPermissionList?.includes(perm),
                ),
                joinedAt: new Date(),
              },
            });
          } else {
            await this.membersRepository.createOne({
              dto: {
                user: userObjectId,
                space: subSpace._id,
                role: SpaceMemberRole.MEMBER,
                joinedAt: new Date(),
                permissions: memberPermissionList,
              },
            });
          }

          const wasInactiveSub =
            !existingSubMember || existingSubMember.isDeleted;
          if (wasInactiveSub) {
            await this.spacesRepository.updateOne({
              query: { _id: subSpace._id },
              dto: { $inc: { membersCount: 1 } },
            });
          }
        }),
      );
    }

    return {
      ...updatedSpace,
      role: member?.role,
      unreadCount: member?.unreadCount,
      isPined: member?.isPined,
      isMuted: member?.isMuted,
      isArchived: member?.isArchived,
      permissions: member?.permissions,
      id: updatedSpace?._id?.toString(),
      _id: undefined,
      lastMessage: {
        ...findSpace?.lastMessage,
        id: findSpace?.lastMessage?._id?.toString(),
        _id: undefined,
        isOutgoing:
          findSpace?.lastMessage?.sender?.toString() ===
          userObjectId?.toString(),
        sender: {
          name: authUser?.name,
          id: authUser?._id,
          username: authUser?.username,
          avatar: authUser?.avatar,
          profileColor: authUser?.profileColor,
        },
      },
    };
  }

  public async leaveFromSpace({ spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFound');

    const member = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    if (!member) throw new NotFoundException('members.notFound');

    if (member.isDeleted) throw new NotFoundException('members.notFound');

    if (member.role === SpaceMemberRole.OWNER)
      throw new BadRequestException('members.ownerCannotLeave');

    await this.membersRepository.updateOne({
      query: { space: spaceObjectId, user: userObjectId },
      dto: {
        isDeleted: true,
        deletedAt: new Date(),
        joinedAt: null,
        role: null,
        adminTag: null,
        adminTagColor: null,
        permission: member?.permissions?.filter((perm) =>
          memberPermissionList?.includes(perm),
        ),
      },
    });

    const updatedSpace = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { $inc: { membersCount: -1 } },
    });

    if (findSpace.type === SpaceTypes.COMMUNITY) {
      const subSpaces = await this.spacesRepository.findLean({
        query: { parentSpace: spaceObjectId },
      });

      await Promise.all(
        subSpaces.map(async (subSpace: any) => {
          const subMember = await this.membersRepository.findOne({
            query: { space: subSpace._id, user: userObjectId },
          });

          if (
            !subMember ||
            subMember.isDeleted ||
            subMember.role === SpaceMemberRole.OWNER
          )
            return;

          await this.membersRepository.updateOne({
            query: { _id: subMember._id },
            dto: {
              isDeleted: true,
              deletedAt: new Date(),
              joinedAt: null,
              role: null,
              adminTag: null,
              adminTagColor: null,
              permission: subMember?.permissions?.filter((perm: string) =>
                memberPermissionList?.includes(perm),
              ),
            },
          });

          await this.spacesRepository.updateOne({
            query: { _id: subSpace._id },
            dto: { $inc: { membersCount: -1 } },
          });
        }),
      );
    }

    return {
      ...updatedSpace.toObject(),
      role: member?.role,
      unreadCount: member?.unreadCount,
      isPined: member?.isPined,
      isMuted: member?.isMuted,
      isArchived: member?.isArchived,
      permissions: member?.permissions,
      id: updatedSpace?._id?.toString(),
      _id: undefined,
      lastMessage: {
        ...findSpace?.lastMessage,
        id: findSpace?.lastMessage?._id?.toString(),
        _id: undefined,
        sender: {
          name: authUser?.name,
          id: authUser?._id,
          username: authUser?.username,
          avatar: authUser?.avatar,
          profileColor: authUser?.profileColor,
        },
      },
    };
  }

  public async deleteSpace({ spaceId, dto, authUser }) {
    const { everybody } = dto;
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser?._id);
    const findMember: any = await this.membersRepository.findOne({
      query: {
        space: spaceObjectId,
        user: userObjectId,
      },
      populate: [
        {
          path: 'space',
          model: 'Space',
        },
      ],
    });

    if (!findMember) throw new NotFoundException('spaces.notFound');

    const space = findMember?.space;
    const isOwner = findMember.role === SpaceMemberRole.OWNER;
    const isChannel = space?.type === SpaceTypes.CHANNEL;
    const isCommunity = space?.type === SpaceTypes.COMMUNITY;
    const isGroup = space?.type === SpaceTypes.GROUP;
    const isPrivate = space?.type === SpaceTypes.PRIVATE;

    if (isChannel && !isOwner)
      throw new BadRequestException('spaces.notDeleted');
    if (isGroup && !isOwner) throw new BadRequestException('spaces.notDeleted');
    const remainingMembers = await this.membersRepository.count({
      query: { space: spaceObjectId, isDeleted: false },
    });

    if (
      everybody ||
      isChannel ||
      isGroup ||
      isCommunity ||
      (isPrivate && remainingMembers <= 1)
    ) {
      if (space?.parentSpace && (isChannel || isGroup)) {
        const decField = isChannel ? 'channelsCount' : 'groupsCount';
        await this.spacesRepository.updateOne({
          query: { _id: space.parentSpace },
          dto: { $inc: { [decField]: -1 } },
        });
      }
      if (isCommunity) {
        const childSpaces = await this.spacesRepository.findLean({
          query: { parentSpace: spaceObjectId },
        });

        if (childSpaces?.length) {
          const childSpaceIds = childSpaces.map((child) => child._id);

          await this.membersRepository.deleteMany({
            query: { space: { $in: childSpaceIds } },
          });

          await this.messagesRepository.deleteMany({
            query: { space: { $in: childSpaceIds } },
          });

          await this.spacesRepository.deleteMany({
            query: { _id: { $in: childSpaceIds } },
          });
        }
      }
      await this.membersRepository.deleteMany({
        query: { space: spaceObjectId },
      });

      await this.messagesRepository.deleteMany({
        query: { space: spaceObjectId },
      });

      const item = await this.spacesRepository.deleteOne({
        query: { _id: spaceObjectId },
      });

      if (!item) throw new NotFoundException('spaces.notDeleted');

      return item;
    } else {
      await this.membersRepository.updateOne({
        query: { user: userObjectId, space: spaceObjectId },
        dto: { isDeleted: true, deletedAt: new Date() },
      });

      const item = await this.spacesRepository.findOne({
        query: { _id: spaceObjectId },
      });

      return item;
    }
  }
}
