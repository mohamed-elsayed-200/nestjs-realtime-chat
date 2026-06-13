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

  public async getAll({ query, authUser }) {
    const userId = new Types.ObjectId(authUser._id);
    const spaces = await this.membersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'bio'],
        allowedFilterFields: ['status'],

        pipelines: [
          // member
          {
            $match: {
              user: userId,
            },
          },

          // space
          {
            $lookup: {
              from: 'spaces',
              localField: 'space',
              foreignField: '_id',
              as: 'space',
            },
          },

          {
            $unwind: '$space',
          },

          // private chat other user
          {
            $set: {
              otherParty: {
                $cond: {
                  if: {
                    $eq: ['$space.sender._id', userId],
                  },
                  then: '$space.received',
                  else: '$space.sender',
                },
              },
            },
          },

          // sort
          {
            $sort: {
              'space.lastMessage.createdAt': -1,
            },
          },

          // final response
          {
            $project: {
              _id: '$space._id',
              unreadCount: '$unreadCount',

              // member settings
              pin: '$pin',
              mute: '$mute',
              archive: '$archive',
              folder: '$folder',

              // space
              type: '$space.type',
              status: '$space.status',
              createdAt: '$space.createdAt',
              updatedAt: '$space.updatedAt',
              membersCount: '$space.membersCount',
              settings: '$space.settings',
              lastMessage: {
                isOutgoing: {
                  $cond: {
                    if: {
                      $eq: ['$space.lastMessage.sender', userId],
                    },
                    then: true,
                    else: false,
                  },
                },
                status: '$space.lastMessage.status',
                text: '$space.lastMessage.text',
                createdAt: '$space.lastMessage.createdAt',
              },

              isContact: {
                $cond: {
                  if: {
                    $eq: ['$space.type', SpaceTypes.PRIVATE],
                  },
                  then: {
                    $eq: ['$otherParty.isContact', 'true'],
                  },
                  else: false,
                },
              },

              name: {
                $cond: {
                  if: {
                    $eq: ['$space.type', SpaceTypes.PRIVATE],
                  },
                  then: {
                    $ifNull: ['$otherParty.contactName', '$otherParty.name'],
                  },
                  else: '$space.name',
                },
              },

              avatar: {
                $cond: {
                  if: {
                    $eq: ['$space.type', SpaceTypes.PRIVATE],
                  },
                  then: {
                    $ifNull: [
                      '$otherParty.contactAvatar',
                      '$otherParty.avatar',
                    ],
                  },
                  else: '$space.avatar',
                },
              },

              profileColor: {
                $cond: {
                  if: {
                    $eq: ['$space.type', SpaceTypes.PRIVATE],
                  },
                  then: {
                    $ifNull: [
                      '$otherParty.contactProfileColor',
                      '$otherParty.profileColor',
                    ],
                  },
                  else: '$space.profileColor',
                },
              },

              // other user
              received: {
                $cond: {
                  if: {
                    $eq: ['$space.type', SpaceTypes.PRIVATE],
                  },
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

  public async getOne({ spaceId, authUser }) {
    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFound');

    const findMember = await this.membersRepository.findOne({
      query: { space: findSpace?._id, user: authUser?._id },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });

    if (!space) throw new NotFoundException('spaces.notFound');

    return space;
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

    // contact snapshot
    const findContact = await this.contactsRepository.findOne({
      query: {
        me: userId,
        contact: otherUserId,
      },
      select: 'name profileColor avatar',
    });

    // private space
    const newSpace = {
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.PRIVATE,

      createdBy: userId,

      sender: {
        _id: userId,
        name: authUser.name,
        avatar: authUser.avatar,
        username: authUser.username,
        profileColor: authUser.profileColor,
        isContact: false,
        contactName: null,
        contactAvatar: null,
        contactProfileColor: null,
      },

      received: {
        _id: otherUserId,
        name: findMember.name,
        avatar: findMember.avatar,
        username: findMember.username,
        profileColor: findMember.profileColor,
        isContact: !!findContact,
        contactName: findContact?.name ?? undefined,
        contactAvatar: findContact?.avatar ?? undefined,
        contactProfileColor: findContact?.profileColor ?? undefined,
      },
    };

    // create space
    const space = await this.spacesRepository.createOne({
      dto: newSpace,
    });

    if (!space) {
      throw new InternalServerErrorException('spaces.notCreated');
    }

    // members
    const members = [otherUserId, userId];

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

    // response
    return {
      ...space.toObject(),

      profileColor: findContact?.profileColor ?? findMember.profileColor,

      name: findContact?.name ?? findMember.name,

      avatar: findContact?.avatar ?? findMember.avatar,

      isContact: !!findContact,

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
    const userId = new Types.ObjectId(authUser?._id);
    await this.membersRepository.updateOne({
      query: {
        space: new Types.ObjectId(spaceId),
        user: new Types.ObjectId(userId),
      },
      dto: {
        unreadCount: 0,
      },
    });
  }
}
