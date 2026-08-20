import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { SpaceMemberRole, SpaceTypes } from '../../../../../common/types/enums';

@Injectable()
export class ClearHistorySpaceService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async clear({ dto, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
    const spaceObjectId = new Types.ObjectId(dto?.space);

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!space) throw new NotFoundException('spaces.notFoundOne');

    const isPrivate = space.type === SpaceTypes.PRIVATE;

    const member = !isPrivate
      ? await this.membersRepository.findOne({
          query: { space: spaceObjectId, user: userObjectId },
        })
      : null;

    if (!isPrivate && !member) {
      throw new BadRequestException('spaces.notMember');
    }

    const isOwner = !isPrivate && member.role === SpaceMemberRole.OWNER;
    if (!isPrivate && !isOwner) {
      throw new BadRequestException('messages.notAllowedToClearHistory');
    }

    const everybody = isPrivate ? Boolean(dto?.everybody) : true;

    if (isPrivate && !everybody) {
      const { modifiedCount } = await this.messagesRepository.updateMany({
        query: { space: spaceObjectId, deletedFrom: { $ne: userObjectId } },
        dto: { $addToSet: { deletedFrom: userObjectId } },
      });

      await this.membersRepository.updateOne({
        query: { space: spaceObjectId, user: userObjectId },
        dto: { lastMessage: null, unreadCount: 0 },
      });

      return { deletedCount: modifiedCount ?? 0, lastMessage: null };
    }

    const { deletedCount } = await this.messagesRepository.deleteMany({
      query: { space: spaceObjectId },
    });

    if (isPrivate) {
      await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { lastMessage: null, unreadCount: 0 },
      });
    } else {
      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { lastMessage: null },
      });

      await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { unreadCount: 0 },
      });
    }

    return { deletedCount: deletedCount ?? 0, lastMessage: null, everybody };
  }
}
