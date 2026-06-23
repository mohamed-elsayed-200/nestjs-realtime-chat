import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { ContactsRepository } from '../../../../common/modules/platform/contacts/contacts.repository';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { MessageStatus, MessageType } from '../../../../common/types/enums';

@Injectable()
export class SpacesService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly contactsRepository: ContactsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async getOne({ space, authUser }) {
    const userId = new Types.ObjectId(authUser._id);
    const spaceId = new Types.ObjectId(space);

    // 1. Find the member with populated space
    const member = await this.membersRepository.findOne({
      query: { space: spaceId, user: userId },
      populate: [
        {
          path: 'space',
          populate: [
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
        },
      ],
    });

    if (!member) throw new NotFoundException('spaces.notFound');

    const spaceData: any = member.space;

    // 2. Get user's contact for this space (if private chat)
    let userContact = null;
    let otherParty = null;
    let spaceContact = null;

    if (spaceData.type === 'private') {
      // Get the other user
      if (spaceData.sender?._id.toString() === userId.toString()) {
        otherParty = spaceData.received;
      } else {
        otherParty = spaceData.sender;
      }

      // Get user's contact with the other person
      userContact = await this.contactsRepository.findOne({
        query: {
          me: userId,
          contact: otherParty?._id,
        },
        select: '_id name avatar profileColor',
      });

      // Get contact from space
      if (spaceData.senderContact) {
        spaceContact = await this.contactsRepository.findOne({
          query: { _id: spaceData.senderContact },
          select: '_id name avatar profileColor',
        });
      } else if (spaceData.receivedContact) {
        spaceContact = await this.contactsRepository.findOne({
          query: { _id: spaceData.receivedContact },
          select: '_id name avatar profileColor',
        });
      }
    }

    // 3. Format the response
    const response = {
      _id: spaceData._id,

      // Member fields
      unreadCount: member.unreadCount,
      pin: member.pin,
      mute: member.mute,
      archive: member.archive,
      folder: member.folder || null,
      role: member.role,
      permissions: member.permissions,
      joinedAt: member.joinedAt,

      // Space fields
      type: spaceData.type,
      status: spaceData.status,
      createdAt: spaceData.createdAt,
      updatedAt: spaceData.updatedAt,
      membersCount: spaceData.membersCount,
      settings: spaceData.settings,
      bio: spaceData.bio,

      // Last message
      lastMessage: spaceData.lastMessage
        ? {
            isOutgoing:
              spaceData.lastMessage.sender?._id?.toString() ===
              userId.toString(),
            id: spaceData.lastMessage._id,
            status: spaceData.lastMessage.status,
            text: spaceData.lastMessage.text,
            createdAt: spaceData.lastMessage.createdAt,
          }
        : null,

      // Name
      name:
        spaceData.type === 'private'
          ? userContact?.name || spaceContact?.name || otherParty?.name || null
          : spaceData.name,

      // Avatar
      avatar:
        spaceData.type === 'private'
          ? userContact?.avatar ||
            spaceContact?.avatar ||
            otherParty?.avatar ||
            null
          : spaceData.avatar,

      // Profile Color
      profileColor:
        spaceData.type === 'private'
          ? userContact?.profileColor ||
            spaceContact?.profileColor ||
            otherParty?.profileColor ||
            null
          : spaceData.profileColor,

      // isContact
      isContact: spaceData.type === 'private' ? !!userContact : false,

      // Received user (for private chats)
      received:
        spaceData.type === 'private'
          ? {
              _id: otherParty?._id,
              name: otherParty?.name,
              username: otherParty?.username,
              avatar: otherParty?.avatar,
              profileColor: otherParty?.profileColor,
              bio: otherParty?.bio,
            }
          : null,
    };

    return response;
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

          // 3. Lookup user details for private chats
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
              pin: 1,
              mute: 1,
              archive: 1,
              permissions: 1,
              wallpaper: 1,
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
          content: `Wallpaper has ben changed to ${wallpaper}`,
          text: `Wallpaper has ben changed to ${wallpaper}`,
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
      dto: { pin: !findMember.pin },
    });

    if (!member) throw new InternalServerErrorException('spaces.notUpdated');

    return { pin: member.pin };
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
      dto: { mute: !findMember.mute },
    });

    if (!member) throw new InternalServerErrorException('spaces.notUpdated');

    return { mute: member.mute };
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
      dto: { archive: !findMember.archive },
    });

    if (!member) throw new InternalServerErrorException('spaces.notUpdated');

    return { archive: member.archive };
  }

  public async delete({ spaceId, authUser }) {
    const findMember = await this.membersRepository.findOne({
      query: {
        space: new Types.ObjectId(spaceId),
        user: new Types.ObjectId(authUser._id),
      },
    });

    if (!findMember) throw new NotFoundException('spaces.notFound');

    await this.membersRepository.deleteMany({
      query: { space: new Types.ObjectId(spaceId) },
    });

    await this.messagesRepository.deleteMany({
      query: { space: new Types.ObjectId(spaceId) },
    });

    const item = await this.spacesRepository.deleteOne({
      query: { _id: new Types.ObjectId(spaceId) },
    });

    if (!item) throw new NotFoundException('spaces.notDeleted');

    return item;
  }

  public async markSpaceAsRead({ spaceId, authUser }) {
    await this.membersRepository.markUnreadCountAsRead({ spaceId, authUser });
  }
}
