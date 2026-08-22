import { Types } from 'mongoose';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MessageStatus, MessageType } from '../../../../../common/types/enums';

@Injectable()
export class ChangeWallpaperSpaceService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async change({ spaceId, dto, authUser }) {
    const { wallpaper, everybody } = dto;
    const userObjectId = new Types.ObjectId(authUser._id);
    const spaceObjectId = new Types.ObjectId(spaceId);

    const findMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });

    if (findMember?.space?.toString() !== spaceObjectId?.toString())
      new NotFoundException('spaces.notFoundOne');

    if (everybody) {
      const systemMessage = await this.messagesRepository.createOne({
        dto: {
          space: spaceObjectId,
          sender: userObjectId,
          messageType: MessageType.SYSTEM,
          status: MessageStatus.SENT,
          content: `${authUser?.name} updated the space wallpaper to "${dto?.wallpaper}"`,
          text: `${authUser?.name} updated the space wallpaper to "${dto?.wallpaper}"`,
        },
      });

      const updateSpace = await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: {
          lastMessage: systemMessage?._id,
          wallpaper,
        },
      });

      if (!updateSpace) new InternalServerErrorException('spaces.notUpdated');

      await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { $inc: { unreadCount: 1 } },
      });

      const formatSystemMessage = {
        ...systemMessage.toObject(),
        id: systemMessage?._id?.toString(),
        _id: undefined,
        __v: undefined,
      };

      return {
        ...updateSpace?.toObject(),
        id: updateSpace?._id?.toString(),
        _id: undefined,
        __v: undefined,
        lastMessage: formatSystemMessage,
        isOutgoing:
          systemMessage?.sender?.toString() === userObjectId?.toString(),
      };
    } else {
      const updateWallpaper = await this.membersRepository.updateMany({
        query: { space: spaceObjectId, user: userObjectId },
        dto: { wallpaper },
      });
      if (!updateWallpaper)
        new InternalServerErrorException('spaces.notUpdated');
      return { ...dto, id: spaceId };
    }
  }
}
