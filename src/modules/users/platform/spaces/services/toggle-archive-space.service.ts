import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class ToggleArchiveSpaceService {
  constructor(private readonly membersRepository: MembersRepository) {}

  public async toggle({ spaceId, authUser }) {
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
      dto: { isArchived: !findMember.isArchived },
    });

    if (!member) throw new InternalServerErrorException('spaces.notUpdated');

    return { isArchived: member.isArchived };
  }
}
