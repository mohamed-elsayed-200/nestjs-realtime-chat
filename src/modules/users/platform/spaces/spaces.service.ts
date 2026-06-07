import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import {
  ActivationStatus,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../common/types/enums';
import { Types } from 'mongoose';
import { UsersRepository } from '../../../../common/modules/iam/users/users.repository';
import { ContactsRepository } from '../../../../common/modules/platform/contacts/contacts.repository';

@Injectable()
export class SpacesService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly contactsRepository: ContactsRepository,
  ) {}

  public async getAll({ query, authUser }) {
    const userId = new Types.ObjectId(authUser._id);
    const spaces = await this.membersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'description'],
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

              lastMessage: '$space.lastMessage',

              // computed
              isContact: {
                $cond: {
                  if: {
                    $eq: ['$space.type', SpaceTypes.PRIVATE],
                  },
                  then: '$otherParty.isContact',
                  else: null,
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
                    description: '$otherParty.description',
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

    const findMember = await this.usersRepository.findOne({
      query: { _id: memberId },
      select: 'name profileColor avatar username description',
    });
    if (!findMember)
      throw new InternalServerErrorException('spaces.memberNotFound');

    const newSpace = {
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.PRIVATE,
      createdBy: userId,
      sender: {
        _id: userId,
        name: authUser?.name,
        avatar: authUser?.avatar,
        username: authUser?.username,
        profileColor: authUser?.profileColor,
      },
      received: {
        _id: new Types.ObjectId(memberId),
        name: findMember?.name,
        avatar: findMember?.avatar,
        username: findMember?.username,
        profileColor: findMember?.profileColor,
      },
    };

    const space = await this.spacesRepository.createOne({ dto: newSpace });
    if (!space) throw new InternalServerErrorException('spaces.notCreated');

    const members = [memberId, authUser._id];
    await Promise.all(
      members.map((id) =>
        this.membersRepository.createOne({
          dto: {
            user: new Types.ObjectId(id),
            space: new Types.ObjectId(space._id?.toString()),
            role: authUser._id.equals(id)
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

    const contact = await this.contactsRepository.findOne({
      query: { me: userId, contact: new Types.ObjectId(memberId) },
      select: 'name profileColor',
    });

    const otherParty = findMember;

    return {
      ...space.toObject(),
      profileColor: contact?.profileColor ?? otherParty.profileColor,
      name: contact?.name ?? otherParty.name,
      avatar: otherParty.avatar,
      received: {
        _id: otherParty._id,
        name: otherParty.name,
        profileColor: otherParty.profileColor,
        avatar: otherParty.avatar,
        username: otherParty.username,
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
      description: dto?.description,
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
      description: dto?.description,
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
      query: { space: spaceId, user: authUser._id },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const member = await this.membersRepository.updateOne({
      query: { space: spaceId, user: authUser._id },
      dto: { pin: !findMember.pin },
    });

    if (!member) throw new InternalServerErrorException('spaces.notUpdated');

    return { pin: member.pin };
  }

  public async toggleMute({ spaceId, authUser }) {
    const findMember = await this.membersRepository.findOne({
      query: { space: spaceId, user: authUser._id },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const member = await this.membersRepository.updateOne({
      query: { space: spaceId, user: authUser._id },
      dto: { mute: !findMember.mute },
    });

    if (!member) throw new InternalServerErrorException('spaces.notUpdated');

    return { mute: member.mute };
  }

  public async toggleArchive({ spaceId, authUser }) {
    const findMember = await this.membersRepository.findOne({
      query: { space: spaceId, user: authUser._id },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const member = await this.membersRepository.updateOne({
      query: { space: spaceId, user: authUser._id },
      dto: { archive: !findMember.archive },
    });

    if (!member) throw new InternalServerErrorException('spaces.notUpdated');

    return { archive: member.archive };
  }

  public async delete({ spaceId, authUser }) {
    const findMember = await this.membersRepository.findOne({
      query: { space: spaceId, user: authUser._id },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    await this.membersRepository.deleteMany({
      query: { space: spaceId },
    });

    const item = await this.spacesRepository.deleteOne({
      query: { _id: spaceId },
    });

    if (!item) throw new NotFoundException('spaces.notDeleted');

    return item;
  }
}
