import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { SpaceTypes } from '../../../../../common/types/enums';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';

@Injectable()
export class DeleteSpaceService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async delete({ spaceId }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const findMember: any = await this.membersRepository.findOne({
      query: {
        space: spaceObjectId,
      },
      populate: [
        {
          path: 'space',
          model: 'Space',
        },
      ],
    });

    if (!findMember) throw new NotFoundException('spaces.notFound');

    const space = findMember?.space;
    const isChannel = space?.type === SpaceTypes.CHANNEL;
    const isCommunity = space?.type === SpaceTypes.COMMUNITY;
    const isGroup = space?.type === SpaceTypes.GROUP;

    if (space?.parentSpace && (isChannel || isGroup)) {
      const decField = isChannel ? 'channelsCount' : 'groupsCount';
      await this.spacesRepository.updateOne({
        query: { _id: space.parentSpace },
        dto: { $inc: { [decField]: -1 } },
      });
    }
    if (isCommunity) {
      const childSpaces = await this.spacesRepository.findLean({
        query: { parentSpace: spaceObjectId },
      });

      if (childSpaces?.length) {
        const childSpaceIds = childSpaces.map((child) => child._id);

        await this.membersRepository.deleteMany({
          query: { space: { $in: childSpaceIds } },
        });

        await this.messagesRepository.deleteMany({
          query: { space: { $in: childSpaceIds } },
        });

        await this.spacesRepository.deleteMany({
          query: { _id: { $in: childSpaceIds } },
        });
      }
    }
    await this.membersRepository.deleteMany({
      query: { space: spaceObjectId },
    });

    await this.messagesRepository.deleteMany({
      query: { space: spaceObjectId },
    });

    const item = await this.spacesRepository.deleteOne({
      query: { _id: spaceObjectId },
    });

    if (!item) throw new NotFoundException('spaces.notDeleted');

    return item;
  }
}
