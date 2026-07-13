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
        {
          path: 'lastMessage',
          select: '_id sender status text createdAt',
        },
      ],
    });

    if (findSpace) {
      // 1. Find the member with populated space
      const member = await this.membersRepository.findOne({
        query: { space: spaceId, user: userId },
      });

      const isMember = Boolean(member?._id) && !member?.isDeleted;
      // 2. Get user's contact for this space (if private space)
      let userContact = null;
      let otherParty = null;

      if (findSpace?.type === SpaceTypes.PRIVATE) {
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

      // 3. Format the response
      const dataMember = isMember
        ? {
            unreadCount: member?.unreadCount || undefined,
            isPined: member?.isPined || undefined,
            isMuted: member?.isMuted || undefined,
            isArchived: member?.isArchived || undefined,
            folder: member?.folder || undefined,
            role: member?.role || undefined,
            permissions: member?.permissions || undefined,
            joinedAt: member?.joinedAt || undefined,
            isBanned: member?.isBanned || undefined,
            bannedAt: member?.bannedAt || undefined,
            received:
              findSpace?.type === SpaceTypes.PRIVATE
                ? {
                    _id: otherParty?._id,
                    name: otherParty?.name,
                    username: otherParty?.username,
                    avatar: otherParty?.avatar,
                    profileColor: otherParty?.profileColor,
                    bio: otherParty?.bio,
                  }
                : null,
            lastMessage: findSpace?.lastMessage
              ? {
                  isOutgoing:
                    findSpace?.lastMessage.sender?._id?.toString() ===
                    userId.toString(),
                  id: findSpace?.lastMessage._id,
                  status: findSpace?.lastMessage.status,
                  text: findSpace?.lastMessage.text,
                  createdAt: findSpace?.lastMessage.createdAt,
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
        createdBy: findSpace?.createdBy || undefined,
        wallpaper: findSpace?.wallpaper || member?.wallpaper || undefined,
        // Name
        name:
          findSpace?.type === SpaceTypes.PRIVATE
            ? userContact?.name || otherParty?.name || null
            : findSpace?.name,

        // Avatar
        avatar:
          findSpace?.type === SpaceTypes.PRIVATE
            ? userContact?.avatar || otherParty?.avatar || null
            : findSpace?.avatar,

        // Profile Color
        profileColor:
          findSpace?.type === SpaceTypes.PRIVATE
            ? userContact?.profileColor || otherParty?.profileColor || null
            : findSpace?.profileColor,

        // isContact
        isContact:
          findSpace?.type === SpaceTypes.PRIVATE ? !!userContact : false,

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
    if (!findSpace) throw new NotFoundException('spaces.notFound');

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
                            { $eq: ['$contact', '$$spaceSender'] },
                            { $eq: ['$contact', '$$spaceReceived'] },
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

          // 5. Lookup contact documents from space
          {
            $lookup: {
              from: 'contacts',
              let: {
                senderContactId: '$space.senderContact',
                receivedContactId: '$space.receivedContact',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $or: [
                        { $eq: ['$_id', '$$senderContactId'] },
                        { $eq: ['$_id', '$$receivedContactId'] },
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
              userContact: {
                $arrayElemAt: ['$userContacts', 0],
              },
              spaceContact: {
                $arrayElemAt: ['$spaceContacts', 0],
              },
            },
          },

          // 3. Lookup last message details
          {
            $lookup: {
              from: 'messages',
              localField: 'space.lastMessage',
              foreignField: '_id',
              as: 'lastMessage',
            },
          },
          {
            $unwind: {
              path: '$lastMessage',
              preserveNullAndEmptyArrays: true,
            },
          },

          // 7. Final projection - FIXED VERSION
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

              // Space fields - use $space.fieldName directly
              type: '$space.type',
              status: '$space.status',
              createdAt: '$space.createdAt',
              updatedAt: '$space.updatedAt',
              membersCount: '$space.membersCount',
              settings: '$space.settings',

              lastMessage: {
                isOutgoing: {
                  $eq: ['$lastMessage.sender', userId],
                },
                id: '$lastMessage._id',
                status: '$lastMessage.status',
                text: '$lastMessage.text',
                createdAt: '$lastMessage.createdAt',
              },

              // FIXED: isContact - check if array is not empty
              isContact: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: {
                    $cond: {
                      if: { $gt: [{ $size: '$userContacts' }, 0] },
                      then: true,
                      else: false,
                    },
                  },
                  else: false,
                },
              },

              // FIXED: wallpaper
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

              // FIXED: name - use proper field references
              name: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: {
                    $cond: {
                      if: { $gt: [{ $size: '$userContacts' }, 0] },
                      then: { $arrayElemAt: ['$userContacts.name', 0] },
                      else: {
                        $cond: {
                          if: { $gt: [{ $size: '$spaceContacts' }, 0] },
                          then: { $arrayElemAt: ['$spaceContacts.name', 0] },
                          else: '$otherParty.name',
                        },
                      },
                    },
                  },
                  else: '$space.name',
                },
              },

              // FIXED: avatar
              avatar: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: {
                    $cond: {
                      if: { $gt: [{ $size: '$userContacts' }, 0] },
                      then: { $arrayElemAt: ['$userContacts.avatar', 0] },
                      else: {
                        $cond: {
                          if: { $gt: [{ $size: '$spaceContacts' }, 0] },
                          then: { $arrayElemAt: ['$spaceContacts.avatar', 0] },
                          else: '$otherParty.avatar',
                        },
                      },
                    },
                  },
                  else: '$space.avatar',
                },
              },

              // FIXED: profileColor
              profileColor: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: {
                    $cond: {
                      if: { $gt: [{ $size: '$userContacts' }, 0] },
                      then: { $arrayElemAt: ['$userContacts.profileColor', 0] },
                      else: {
                        $cond: {
                          if: { $gt: [{ $size: '$spaceContacts' }, 0] },
                          then: {
                            $arrayElemAt: ['$spaceContacts.profileColor', 0],
                          },
                          else: '$otherParty.profileColor',
                        },
                      },
                    },
                  },
                  else: '$space.profileColor',
                },
              },

              // FIXED: received
              received: {
                $cond: {
                  if: { $eq: ['$space.type', 'private'] },
                  then: {
                    _id: '$otherParty._id',
                    name: '$otherParty.name',
                    username: '$otherParty.username',
                    avatar: '$otherParty.avatar',
                    profileColor: '$otherParty.profileColor',
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
}
