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
          {
            $match: {
              user: userId,
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
          {
            $unwind: '$space',
          },
          {
            $replaceRoot: {
              newRoot: '$space',
            },
          },
          {
            $lookup: {
              from: 'messages',
              localField: 'lastMessage',
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
          {
            $lookup: {
              from: 'users',
              localField: 'received',
              foreignField: '_id',
              as: 'received',
            },
          },
          {
            $unwind: {
              path: '$received',
              preserveNullAndEmptyArrays: true,
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
            $addFields: {
              otherParty: {
                $cond: {
                  if: { $eq: ['$sender._id', userId] },
                  then: '$received',
                  else: '$sender',
                },
              },
            },
          },
          {
            $lookup: {
              from: 'contacts',
              let: { otherPartyId: '$otherParty._id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$me', userId] },
                        { $eq: ['$contact', '$$otherPartyId'] },
                      ],
                    },
                  },
                },
              ],
              as: 'contact',
            },
          },
          {
            $unwind: {
              path: '$contact',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              pin: 1,
              mute: 1,
              archive: 1,
              status: 1,
              type: 1,
              createdAt: 1,
              updatedAt: 1,
              membersCount: 1,
              lastMessage: 1,
              description: 1,
              isContact: {
                $cond: {
                  if: { $eq: ['$type', SpaceTypes.PRIVATE] },
                  then: { $gt: [{ $ifNull: ['$contact._id', null] }, null] },
                  else: null,
                },
              },
              profileColor: {
                $cond: {
                  if: { $eq: ['$type', SpaceTypes.PRIVATE] },
                  then: {
                    $ifNull: [
                      '$contact.profileColor',
                      '$otherParty.profileColor',
                    ],
                  },
                  else: '$profileColor',
                },
              },
              name: {
                $cond: {
                  if: { $eq: ['$type', SpaceTypes.PRIVATE] },
                  then: {
                    $ifNull: ['$contact.name', '$otherParty.name'],
                  },
                  else: '$name',
                },
              },
              avatar: {
                $cond: {
                  if: { $eq: ['$type', SpaceTypes.PRIVATE] },
                  then: '$otherParty.avatar',
                  else: '$avatar',
                },
              },
              received: {
                _id: '$otherParty._id',
                name: '$otherParty.name',
                profileColor: '$otherParty.profileColor',
                avatar: '$otherParty.avatar',
                username: '$otherParty.username',
                description: '$otherParty.description',
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
      sender: userId,
      received: new Types.ObjectId(memberId),
    };

    const space = await this.spacesRepository.createOne({ dto: newSpace });
    if (!space) throw new InternalServerErrorException('spaces.notCreated');

    const members = [memberId, authUser._id];
    await Promise.all(
      members.map((id) =>
        this.membersRepository.createOne({
          dto: {
            user: new Types.ObjectId(id),
            space: space._id,
            role: authUser._id.equals(id)
              ? SpaceMemberRole.OWNER
              : SpaceMemberRole.MEMBER,
            joinedAt: new Date(),
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
          },
        }),
      ),
    );

    return space;
  }

  public async createChannel({ dto, authUser }) {
    const members = [
      ...dto.members?.filter((id) => id !== authUser._id.toString()),
      authUser._id.toString(),
    ];

    const newSpace = {
      name: dto?.name,
      avatar: dto?.avatar,
      profileColor: this.usersRepository.getRandomColor(),
      description: dto?.description,
      archive: false,
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.CHANNEL,
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
            space: space._id,
            role:
              authUser._id.toString() === id
                ? SpaceMemberRole.OWNER
                : SpaceMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        }),
      ),
    );

    return space;
  }
  public async togglePin({ spaceId, authUser }) {
    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFound');

    const findMember = await this.membersRepository.findOne({
      query: { space: findSpace?._id, user: authUser?._id },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const space = await this.spacesRepository.updateOne({
      query: { _id: spaceId },
      dto: { pin: !findSpace.pin },
    });
    if (!space) throw new InternalServerErrorException('spaces.notUpdated');

    return space;
  }

  public async toggleMute({ spaceId, authUser }) {
    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFound');

    const findMember = await this.membersRepository.findOne({
      query: { space: findSpace?._id, user: authUser?._id },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const space = await this.spacesRepository.updateOne({
      query: { _id: spaceId },
      dto: { mute: !findSpace.mute },
    });
    if (!space) throw new InternalServerErrorException('spaces.notUpdated');

    return space;
  }

  public async toggleArchive({ spaceId, authUser }) {
    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFound');

    const findMember = await this.membersRepository.findOne({
      query: { space: findSpace?._id, user: authUser?._id },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const space = await this.spacesRepository.updateOne({
      query: { _id: spaceId },
      dto: { archive: !findSpace.archive },
    });
    if (!space) throw new InternalServerErrorException('spaces.notUpdated');

    return space;
  }

  public async delete({ spaceId, authUser }) {
    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFound');

    const findMember = await this.membersRepository.findOne({
      query: { space: findSpace?._id, user: authUser?._id },
    });
    if (!findMember) throw new NotFoundException('spaces.notFound');

    const item = await this.spacesRepository.deleteOne({
      query: { _id: findSpace._id },
    });

    if (!item) throw new NotFoundException('spaces.notDeleted');

    return item;
  }
}
