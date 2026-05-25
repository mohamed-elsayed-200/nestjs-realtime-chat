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

@Injectable()
export class SpacesService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async getAll({ query, authUser }) {
    const userId = new Types.ObjectId(authUser._id);

    return this.spacesRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'description'],
        allowedFilterFields: ['status'],
        pipelines: [
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
                        { $eq: ['$user', userId] },
                      ],
                    },
                  },
                },
              ],
              as: 'userMembership',
            },
          },

          {
            $match: {
              userMembership: { $ne: [] },
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
                      $eq: ['$space', '$$spaceId'],
                    },
                  },
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
                  },
                },
                {
                  $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $project: {
                    role: 1,
                    joinedAt: 1,
                    lastReadMessage: 1,
                    _id: '$user._id',
                    name: '$user.name',
                    email: '$user.email',
                    avatar: '$user.avatar',
                    profileColor: '$user.profileColor',
                  },
                },
              ],
              as: 'members',
            },
          },

          {
            $project: {
              name: 1,
              avatar: 1,
              description: 1,
              status: 1,
              type: 1,
              isPrivate: 1,
              createdAt: 1,
              updatedAt: 1,
              members: 1,
            },
          },
        ],
      },
    });
  }

  public async getOne({ spaceId, authUser }) {
    const space = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });

    if (!space) throw new NotFoundException('spaces.notFound');

    return space;
  }

  public async createPrivate({ dto, authUser }) {
    const newSpace = {
      archived: false,
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.PRIVATE,
      createdBy: authUser._id,
    };

    const space = await this.spacesRepository.createOne({ dto: newSpace });

    if (!space) {
      throw new InternalServerErrorException('spaces.notCreated');
    }

    const members = [dto.memberId, authUser._id];

    const createdMembers = await Promise.all(
      members.map((id) =>
        this.membersRepository.createOne({
          dto: {
            user: new Types.ObjectId(id),
            space: space._id,
            role:
              authUser._id.toString() === id.toString()
                ? SpaceMemberRole.ADMIN
                : SpaceMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        }),
      ),
    );

    return {
      ...space.toObject(),
      members: createdMembers,
    };
  }

  public async update({ spaceId, dto, authUser }) {
    const space = await this.spacesRepository.updateOne({
      query: { _id: spaceId },
      dto,
    });
    if (!space) throw new NotFoundException('spaces.notUpdated');

    return space;
  }

  public async delete({ spaceId, authUser }) {
    const item = await this.spacesRepository.deleteOne({
      query: { _id: spaceId },
    });

    if (!item) throw new NotFoundException('spaces.notDeleted');

    return item;
  }
}
