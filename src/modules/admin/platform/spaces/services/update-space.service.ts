import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SpaceTypes } from '../../../../../common/types/enums';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';

@Injectable()
export class UpdateSpaceService {
  constructor(private readonly spacesRepository: SpacesRepository) {}

  public async update({ spaceId, dto }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const space = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { status: dto?.status },
    });

    if (!space) throw new NotFoundException('spaces.notFound');

    return {
      space: {
        ...space?.toObject(),
        id: space?.id?.toString(),
        _id: undefined,
      },
    };
  }
}
