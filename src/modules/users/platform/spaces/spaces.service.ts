import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { UsersRepository } from '../../../../common/modules/iam/users/users.repository';
import { ContactsRepository } from '../../../../common/modules/platform/contacts/contacts.repository';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import {
  ActivationStatus,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../common/types/enums';

@Injectable()
export class SpacesService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
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

          // 7. Final projection - FIXED VERSION
          {
            $project: {
              _id: '$space._id',
              unreadCount: 1,
              pin: 1,
              mute: 1,
              archive: 1,
              folder: { $ifNull: ['$folder', null] },

              // Space fields - use $space.fieldName directly
              type: '$space.type',
              status: '$space.status',
              createdAt: '$space.createdAt',
              updatedAt: '$space.updatedAt',
              membersCount: '$space.membersCount',
              settings: '$space.settings',

              lastMessage: {
                $cond: {
                  if: { $ne: ['$space.lastMessage', null] },
                  then: {
                    isOutgoing: {
                      $eq: ['$space.lastMessage.sender', userId],
                    },
                    id: '$space.lastMessage._id',
                    status: '$space.lastMessage.status',
                    text: '$space.lastMessage.text',
                    createdAt: '$space.lastMessage.createdAt',
                  },
                  else: null,
                },
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

  public async createPrivate({ dto, authUser }) {
    const { memberId } = dto;

    const userId = new Types.ObjectId(authUser._id);
    const otherUserId = new Types.ObjectId(memberId);

    // other user
    const findMember = await this.usersRepository.findOne({
      query: { _id: otherUserId },
      select: 'name profileColor avatar username bio',
    });

    if (!findMember) {
      throw new InternalServerErrorException('spaces.memberNotFound');
    }

    // Check if contact exists from both sides
    const [senderContact, receivedContact] = await Promise.all([
      this.contactsRepository.findOne({
        query: {
          me: userId,
          contact: otherUserId,
        },
        select: 'name profileColor avatar',
      }),
      this.contactsRepository.findOne({
        query: {
          me: otherUserId,
          contact: userId,
        },
        select: 'name profileColor avatar',
      }),
    ]);

    // Determine which contact to use (prefer sender's contact, then receiver's)
    const contactToUse = senderContact || receivedContact;

    // Private space
    const newSpace = {
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.PRIVATE,
      createdBy: userId,
      sender: userId,
      received: otherUserId,
      senderContact: senderContact?._id || null,
      receivedContact: receivedContact?._id || null,
      // For backward compatibility, you might want to add a virtual field
    };

    // Create space
    const space = await this.spacesRepository.createOne({
      dto: newSpace,
    });

    if (!space) {
      throw new InternalServerErrorException('spaces.notCreated');
    }

    // Members
    const members =
      otherUserId?.toString() === userId?.toString()
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
            pin: false,
            mute: false,
            archive: false,
          },
        }),
      ),
    );

    // Response
    return {
      ...space.toObject(),
      profileColor: contactToUse?.profileColor ?? findMember.profileColor,
      name: contactToUse?.name ?? findMember.name,
      avatar: contactToUse?.avatar ?? findMember.avatar,
      isContact: !!contactToUse,
      received: {
        _id: findMember._id,
        name: findMember.name,
        profileColor: findMember.profileColor,
        avatar: findMember.avatar,
        username: findMember.username,
      },
    };
  }

  public async createGroup({ dto, authUser }) {
    const members = [
      ...dto.members?.filter((id) => id !== authUser._id.toString()),
      authUser._id.toString(),
    ];

    const newSpace = {
      name: dto?.name,
      settings: dto?.settings,
      avatar: dto?.avatar,
      profileColor: this.usersRepository.getRandomColor(),
      bio: dto?.bio,
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.GROUP,
      createdBy: new Types.ObjectId(authUser._id),
      membersCount: members?.length,
    };

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
            joinedAt: new Date(),
            pin: false,
            mute: false,
            archive: false,
          },
        }),
      ),
    );

    return space;
  }

  public async createChannel({ dto, authUser }) {
    const newSpace = {
      name: dto?.name,
      avatar: dto?.avatar,
      profileColor: this.usersRepository.getRandomColor(),
      bio: dto?.bio,
      archive: false,
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.CHANNEL,
      createdBy: new Types.ObjectId(authUser._id),
      membersCount: 1,
      settings: dto?.settings,
    };

    const space = await this.spacesRepository.createOne({ dto: newSpace });
    if (!space) throw new InternalServerErrorException('spaces.notCreated');

    await this.membersRepository.createOne({
      dto: {
        user: new Types.ObjectId(authUser._id),
        space: new Types.ObjectId(space._id?.toString()),
        role: SpaceMemberRole.OWNER,
        joinedAt: new Date(),
        pin: false,
        mute: false,
        archive: false,
      },
    });

    return space;
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
