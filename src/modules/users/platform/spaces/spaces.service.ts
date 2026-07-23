import { JoinRequestStatus } from './../../../../common/modules/platform/join-requests/join-request.schema';
import { UsersRepository } from './../../../../common/modules/iam/users/users.repository';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { ContactsRepository } from '../../../../common/modules/platform/contacts/contacts.repository';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import {
  ActivationStatus,
  adminPermissionList,
  JoinApproval,
  memberPermissionList,
  MessageStatus,
  MessageType,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../common/types/enums';
import { JoinRequestsRepository } from '../../../../common/modules/platform/join-requests/join-requests.repository';

@Injectable()
export class SpacesService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly contactsRepository: ContactsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly joinRequestsRepository: JoinRequestsRepository,
  ) {}

  public async getOne({ spaceOrUserId, authUser }) {
    const userId = new Types.ObjectId(authUser._id);
    const spaceId = new Types.ObjectId(spaceOrUserId);

    // 1. Find member first (to get per-user lastMessage for private chats)
    const member = await this.membersRepository.findOne({
      query: { space: spaceId, user: userId },
    });

    const isMember = Boolean(member?._id);

    // 2. Get space with populated fields
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
      // FIX: Determine effective lastMessage ID
      // Private -> member.lastMessage (per-user)
      // Group/Channel -> space.lastMessage (global)
      const isPrivate = findSpace?.type === SpaceTypes.PRIVATE;
      const effectiveLastMessageId = isPrivate
        ? member?.lastMessage
        : findSpace?.lastMessage;

      // FIX: Lookup last message details
      let lastMessageData = null;
      if (effectiveLastMessageId) {
        lastMessageData = await this.messagesRepository.findOne({
          query: { _id: effectiveLastMessageId },
          select: '_id sender status text createdAt',
        });
      }

      // 3. Get user's contact for this space (if private space)
      let userContact = null;
      let otherParty = null;

      if (isPrivate) {
        // Get the other user
        if (findSpace?.sender?._id.toString() === userId.toString()) {
          otherParty = findSpace?.received;
        } else {
          otherParty = findSpace?.sender;
        }

        // Get user's contact with the other person
        userContact = await this.contactsRepository.findOne({
          query: {
            me: userId,
            contact: otherParty?._id,
          },
          select: '_id name avatar profileColor',
        });
      }

      // 4. Format the response
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
            received: isPrivate
              ? {
                  _id: otherParty?._id,
                  name: otherParty?.name,
                  username: otherParty?.username,
                  avatar: otherParty?.avatar,
                  profileColor: otherParty?.profileColor,
                  bio: otherParty?.bio,
                }
              : null,
            // FIX: Use lastMessageData instead of findSpace.lastMessage
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
        // Space fields
        _id: findSpace?._id,
        type: findSpace?.type,
        status: findSpace?.status,
        createdAt: findSpace?.createdAt,
        updatedAt: findSpace?.updatedAt,
        membersCount: findSpace?.membersCount,
        settings: findSpace?.settings,
        bio: findSpace?.bio || otherParty?.bio,
        createdBy: findSpace?.createdBy,
        wallpaper: findSpace?.wallpaper || member?.wallpaper,
        // Name
        name: isPrivate
          ? userContact?.name || otherParty?.name || null
          : findSpace?.name,

        // Avatar
        avatar: isPrivate
          ? userContact?.avatar || otherParty?.avatar || null
          : findSpace?.avatar,

        // Profile Color
        profileColor: isPrivate
          ? userContact?.profileColor || otherParty?.profileColor || null
          : findSpace?.profileColor,

        // isContact
        isContact: isPrivate ? !!userContact : false,

        // Member fields
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

      const response = {
        _id: user?._id,
        unreadCount: 0,
        isPined: false,
        isMuted: false,
        isArchived: false,
        type: SpaceTypes.PRIVATE,
        bio: user?.bio,
        name: findContact?.name || user?.name,
        username: user?.username,
        avatar: findContact?.avatar || user?.avatar,
        profileColor: findContact?.profileColor || user?.profileColor,
        isContact: findContact?._id ? true : false,
        received: {
          _id: user?._id,
          name: findContact?.name || user?.name,
          avatar: findContact?.avatar || user?.avatar,
          profileColor: findContact?.profileColor || user?.profileColor,
          username: user?.username,
          bio: user?.bio,
        },
      };

      return response;
    }
  }

  public async openLink({ dto, authUser }) {
    const { linkText, linkType } = dto;
    let query: any = {};

    if (linkType === SpaceTypes.CHANNEL) {
      query = { 'settings.channel.channelLink': linkText };
    } else if (linkType === SpaceTypes.GROUP) {
      query = { 'settings.group.groupLink': linkText };
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

    // already a member → return full space via getOne
    return {
      ...getSpace,
      joinRequest: findRequest || undefined,
    };
  }

  public async getAll({ query, authUser }) {
    const userId = new Types.ObjectId(authUser._id);

    const spaces = await this.membersRepository.findAll({
      query: query,
      options: {
        allowedSearchFields: ['name', 'bio'],
        allowedFilterFields: ['status', 'type', 'archive'],
        pipelines: [
          // 1. Filter by user
          {
            $match: {
              user: userId,
              isDeleted: false,
            },
          },

          // 2. Lookup space
          {
            $lookup: {
              from: 'spaces',
              localField: 'space',
              foreignField: '_id',
              as: 'space',
            },
          },
          { $unwind: '$space' },

          // 3. Lookup user details for private spaces
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

          // 4. Lookup user's contacts (where current user is 'me')
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

          // 5. Lookup only the contact document that belongs to the CURRENT user
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

          // 6. Determine other party and set fields
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

          // 6.1 Resolve unified display fields once
          {
            $addFields: {
              resolvedName: {
                $ifNull: [
                  '$userContact.name',
                  { $ifNull: ['$spaceContact.name', '$otherParty.name'] },
                ],
              },
              resolvedAvatar: {
                $ifNull: [
                  '$userContact.avatar',
                  { $ifNull: ['$spaceContact.avatar', '$otherParty.avatar'] },
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

          // 7. FIX: Determine effective lastMessage ID
          // Private -> member.lastMessage (per-user)
          // Group/Channel -> space.lastMessage (global)
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

          // 8. Lookup last message details
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

          // 9. Final projection
          {
            $project: {
              _id: '$space._id',
              unreadCount: 1,
              isPined: 1,
              isMuted: 1,
              isArchived: 1,
              permissions: 1,
              role: 1,
              folder: { $ifNull: ['$folder', null] },

              type: '$space.type',
              status: '$space.status',
              createdAt: '$space.createdAt',
              updatedAt: '$space.updatedAt',
              membersCount: '$space.membersCount',
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
            },
          },
        ],
      },
    });

    return spaces;
  }

  public async changeWallpaper({ spaceId, dto, authUser }) {
    const { wallpaper, everybody } = dto;
    const userObjectId = new Types.ObjectId(authUser._id);
    const spaceObjectId = new Types.ObjectId(spaceId);

    // check member inside space
    const findMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    if (findMember?.space?.toString() !== spaceObjectId?.toString())
      new NotFoundException('spaces.notFoundOne');

    if (everybody) {
      // change wallpaper for every body
      const updateWallpaper = await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { wallpaper, $inc: { unreadCount: 1 } },
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

      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: {
          lastMessage: lastMessage?._id,
        },
      });

      if (!updateWallpaper)
        new InternalServerErrorException('spaces.notUpdated');

      return {
        ...dto,
        spaceId,
        lastMessage: {
          ...lastMessage.toObject(),
          sender: {
            name: authUser?.name,
            id: authUser?.id,
            username: authUser?.username,
            avatar: authUser?.avatar,
            profileColor: authUser?.profileColor,
          },
          isOutgoing:
            lastMessage?.sender?.toString() === userObjectId?.toString(),
        },
      };
    } else {
      // change wallpaper for every one
      const updateWallpaper = await this.membersRepository.updateMany({
        query: { space: spaceObjectId, user: userObjectId },
        dto: { wallpaper },
      });
      if (!updateWallpaper)
        new InternalServerErrorException('spaces.notUpdated');
      return dto;
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

  public async delete({ spaceId, dto, authUser }) {
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
      (isPrivate && remainingMembers <= 1)
    ) {
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
    const isPrivate = dto?.type === SpaceTypes.PRIVATE;
    const isBot = dto?.type === SpaceTypes.BOT;
    if (isPrivate || isBot)
      throw new NotFoundException('spaces.checkSpaceType');

    if (isGroup && dto?.settings) dto.settings.channel = null;
    if (isChannel && dto?.settings) dto.settings.group = null;

    const members = [
      ...dto?.members?.filter((id) => id !== authUser._id.toString()),
      authUser._id.toString(),
    ];

    const newSpace = {
      name: dto?.name,
      bio: dto?.bio,
      avatar: dto?.avatar,
      profileColor: dto?.profileColor || this.usersRepository.getRandomColor(),
      wallpaper: dto?.wallpaper || undefined,
      settings: dto?.settings,
      isArchived: false,
      status: ActivationStatus.ACTIVE,
      type: dto?.type,
      createdBy: new Types.ObjectId(authUser._id),
      membersCount: members?.length,
    };

    const findSpace = await this.spacesRepository.findOne({
      query: {
        $or: [
          {
            'settings.channel.channelLink': dto?.settings?.channel?.channelLink,
          },
          {
            'settings.group.groupLink': dto?.settings?.group?.groupLink,
          },
        ],
      },
    });
    if (findSpace)
      throw new BadRequestException('spaces.channelLinkAlreadyUsed');

    const space = await this.spacesRepository.createOne({ dto: newSpace });
    if (!space) throw new InternalServerErrorException('spaces.notCreated');

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
    const isPrivate = dto?.type === SpaceTypes.PRIVATE;
    const isBot = dto?.type === SpaceTypes.BOT;
    if (isPrivate || isBot)
      throw new BadRequestException('spaces.checkSpaceType');

    if (isGroup && dto?.settings) dto.settings.channel = null;
    if (isChannel && dto?.settings) dto.settings.group = null;

    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser?._id);

    const member = await this.membersRepository.findOne({
      query: {
        user: userObjectId,
        space: spaceObjectId,
      },
    });

    if (!member) throw new NotFoundException('members.notFoundOne');

    const canUpdate =
      member.role === SpaceMemberRole.OWNER ||
      member.role === SpaceMemberRole.ADMIN;

    if (!canUpdate) throw new InternalServerErrorException('spaces.notUpdated');

    const space = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId, type: dto?.type },
      dto,
    });

    if (!space) throw new InternalServerErrorException('spaces.notUpdated');

    // Update wallpaper
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

      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: {
          lastMessage: lastMessage?._id,
        },
      });

      if (!updateWallpaper)
        new InternalServerErrorException('spaces.notUpdated');

      return {
        ...dto,
        id: spaceId,
        lastMessage: {
          ...lastMessage.toObject(),
          sender: {
            name: authUser?.name,
            id: authUser?.id,
            username: authUser?.username,
            avatar: authUser?.avatar,
            profileColor: authUser?.profileColor,
          },
          isOutgoing:
            lastMessage?.sender?.toString() === userObjectId?.toString(),
        },
      };
    }

    return space;
  }

  public async addMembersToSpace({ spaceId, dto, authUser }) {
    const { contacts } = dto;
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    // 1. Check owner
    const member = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!member) throw new NotFoundException('members.notFound');
    if (member.role !== SpaceMemberRole.OWNER)
      throw new BadRequestException('spaces.cantAddMembers');

    // 2. Get valid contacts
    const contactDocs = await this.contactsRepository.findMany({
      query: {
        contact: { $in: contacts.map((id) => new Types.ObjectId(id)) },
        me: userObjectId,
      },
      select: 'contact',
    });
    if (contactDocs.length === 0)
      throw new NotFoundException('contacts.notFound');

    // 3. Dedupe user IDs
    const userIds = [...new Set(contactDocs.map((c) => c.contact.toString()))];

    // 4. Get existing members (active + deleted)
    const existing = await this.membersRepository.findMany({
      query: {
        space: spaceObjectId,
        user: { $in: userIds.map((id) => new Types.ObjectId(id)) },
      },
      select: 'user isDeleted',
    });

    // 5. Build lookup map: userId → isDeleted
    const existingMap = new Map(
      existing.map((m) => [m.user.toString(), m.isDeleted]),
    );

    const toRestore: string[] = [];
    const toInsert: string[] = [];

    for (const id of userIds) {
      const isDeleted = existingMap.get(id);
      if (isDeleted === undefined) toInsert.push(id);
      else if (isDeleted === true) toRestore.push(id);
      // else active → skip
    }

    // 6. Restore deleted
    if (toRestore.length > 0) {
      await this.membersRepository.updateMany({
        query: {
          space: spaceObjectId,
          user: { $in: toRestore.map((id) => new Types.ObjectId(id)) },
          isDeleted: true,
        },
        dto: {
          isDeleted: false,
          isBanned: false,
          bannedAt: null,
          deletedAt: null,
          joinedAt: new Date(),
        },
      });
    }

    // 7. Insert new
    if (toInsert.length > 0) {
      await this.membersRepository.insertMany({
        documents: toInsert.map((userId) => ({
          user: new Types.ObjectId(userId),
          space: spaceObjectId,
          role: SpaceMemberRole.MEMBER,
          joinedAt: new Date(),
          isPined: false,
          isMuted: false,
          isArchived: false,
          permissions: [],
        })),
      });
    }

    // 8. Update count
    const total = toRestore.length + toInsert.length;
    if (total === 0) {
      return this.spacesRepository.findOne({ query: { _id: spaceObjectId } });
    }

    return this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { $inc: { membersCount: total } },
    });
  }

  public async joinToSpace({ spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    // check space already exist
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
    const isGroup = findSpace?.type === SpaceTypes.GROUP;
    const isChannel = findSpace?.type === SpaceTypes.CHANNEL;
    const isPrivate = findSpace?.type === SpaceTypes.PRIVATE;
    const isBot = findSpace?.type === SpaceTypes.BOT;
    if (isPrivate || isBot)
      throw new BadRequestException('spaces.checkSpaceType');

    // check is private channel
    const settings = isChannel
      ? findSpace?.settings?.channel
      : findSpace?.settings?.group;
    const inviteOnly = settings.joinApproval === JoinApproval.INVITE_ONLY;
    const needApproval = settings.joinApproval === JoinApproval.NEED_APPROVAL;
    const isSecure = inviteOnly || needApproval;
    if (isSecure) throw new BadRequestException('spaces.isSecure');

    // check if member already joined
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

    return {
      ...updatedSpace,
      unreadCount: member?.unreadCount,
      isPined: member?.isPined,
      isMuted: member?.isMuted,
      isArchived: member?.isArchived,
      folder: member?.folder,
      role: member?.role,
      permissions: member?.permissions,
      joinedAt: member?.joinedAt,
      wallpaper: member?.wallpaper,
      lastMessage: {
        ...findSpace?.lastMessage,
        isOutgoing:
          findSpace?.lastMessage?.sender?.toString() ===
          userObjectId?.toString(),
        sender: {
          name: authUser?.name,
          id: authUser?.id,
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

    const member = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    if (!member) throw new NotFoundException('members.notFound');

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
      // dto: { membersCount:9 },
    });
    return updatedSpace;
  }
}
