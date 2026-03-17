import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { SpaceMemberRole, UserType } from 'src/common/types/enums';
import { Types } from 'mongoose';

@Injectable()
export class SpacesService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async getAll({ query }) {
    return this.spacesRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'description'],
        allowedFilterFields: ['status'],
        pipelines: [
          {
            $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: 'space',
              as: 'getProducts',
            },
          },
          {
            $project: {
              name: 1,
              thumbnail: 1,
              description: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              products: { $size: '$getProducts' },
            },
          },
        ],
      },
    });
  }

  public async getOne({ spaceId }) {
    const space = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });

    if (!space) throw new NotFoundException('spaces.notFound');

    return space;
  }

  public async create({ dto, authUser }) {
    const space = await this.spacesRepository.createOne({ dto });

    if (!space) {
      throw new InternalServerErrorException('spaces.notCreated');
    }

    await Promise.all(
      dto.members?.map((id) =>
        this.membersRepository.createOne({
          dto: {
            user: new Types.ObjectId(id),
            space: space._id,
            role:
              authUser._id.toString() === id
                ? SpaceMemberRole.ADMIN
                : SpaceMemberRole.MEMBER,
            joinedAt: new Date(),
          },
        }),
      ),
    );

    return space;
  }

  public async update({ spaceId, dto }) {
    const space = await this.spacesRepository.updateOne({
      query: { _id: spaceId },
      dto,
    });
    if (!space) throw new NotFoundException('spaces.notUpdated');

    return space;
  }

  public async delete({ spaceId }) {
    const item = await this.spacesRepository.deleteOne({
      query: { _id: spaceId },
    });

    if (!item) throw new NotFoundException('spaces.notDeleted');

    return item;
  }
}
