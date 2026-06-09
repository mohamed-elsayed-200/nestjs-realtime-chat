import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ReactionsRepository } from '../../../../common/modules/platform/reactions/reactions.repository';

@Injectable()
export class ReactionsService {
  constructor(private readonly reactionsRepository: ReactionsRepository) {}

  public async getAll({ query }) {
    return this.reactionsRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'bio'],
        allowedFilterFields: ['status'],
        pipelines: [
          {
            $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: 'reaction',
              as: 'getProducts',
            },
          },
          {
            $project: {
              name: 1,
              thumbnail: 1,
              bio: 1,
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

  public async getOne({ reactionId }) {
    const reaction = await this.reactionsRepository.findOne({
      query: { _id: reactionId },
    });

    if (!reaction) throw new NotFoundException('reactions.notFound');

    return reaction;
  }

  public async create({ dto }) {
    const reaction = await this.reactionsRepository.createOne({ dto });

    if (!reaction)
      throw new InternalServerErrorException('reactions.notCreated');

    return reaction;
  }

  public async update({ reactionId, dto }) {
    const reaction = await this.reactionsRepository.updateOne({
      query: { _id: reactionId },
      dto,
    });
    if (!reaction) throw new NotFoundException('reactions.notUpdated');

    return reaction;
  }

  public async delete({ reactionId }) {
    const item = await this.reactionsRepository.deleteOne({
      query: { _id: reactionId },
    });

    if (!item) throw new NotFoundException('reactions.notDeleted');

    return item;
  }
}
