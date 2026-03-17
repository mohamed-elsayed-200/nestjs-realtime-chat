import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';

@Injectable()
export class MembersService {
  constructor(private readonly membersRepository: MembersRepository) {}

  public async getAll({ query }) {
    return this.membersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'description'],
        allowedFilterFields: ['status'],
        pipelines: [
          {
            $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: 'member',
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

  public async getOne({ memberId }) {
    const member = await this.membersRepository.findOne({
      query: { _id: memberId },
    });

    if (!member) throw new NotFoundException('members.notFound');

    return member;
  }

  public async create({ dto }) {
    const member = await this.membersRepository.createOne({ dto });

    if (!member) throw new InternalServerErrorException('members.notCreated');

    return member;
  }

  public async update({ memberId, dto }) {
    const member = await this.membersRepository.updateOne({
      query: { _id: memberId },
      dto,
    });
    if (!member) throw new NotFoundException('members.notUpdated');

    return member;
  }

  public async delete({ memberId }) {
    const item = await this.membersRepository.deleteOne({
      query: { _id: memberId },
    });

    if (!item) throw new NotFoundException('members.notDeleted');

    return item;
  }
}
