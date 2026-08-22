import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';

@Injectable()
export class GetCallSettingsServices {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async get({ spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const authUserObjectId = new Types.ObjectId(authUser._id);

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!space) throw new NotFoundException('Space not found');

    const member = await this.membersRepository.findOne({
      query: { user: authUserObjectId, space: spaceObjectId },
    });
    if (!member) {
      throw new BadRequestException('You are not a member of this space');
    }

    const settings = space.settings?.call ?? {};

    return {
      spaceId: space._id.toString(),
      settings,
    };
  }
}
