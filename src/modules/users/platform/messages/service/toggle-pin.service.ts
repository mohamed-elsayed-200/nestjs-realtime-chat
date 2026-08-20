import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  MessageStatus,
  MessageType,
  SpaceMemberPermission,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class TogglePinMessageService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async toggle({ dto, authUser }) {
    const { messages, space, isPinned, everybody } = dto;
    const userObjectId = new Types.ObjectId(authUser?._id);
    const spaceObjectId = new Types.ObjectId(space);

    const member = await this.membersRepository.findOne({
      query: {
        user: userObjectId,
        space: spaceObjectId,
      },
    });
    if (!member) throw new NotFoundException('members.notFound');

    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFoundOne');

    const isPrivate = findSpace.type === SpaceTypes.PRIVATE;

    const messageIdsArray = Array.isArray(messages) ? messages : [messages];
    const messageObjectIds = messageIdsArray.map(
      (id) => new Types.ObjectId(id),
    );

    if (everybody === false) {
      const update = isPinned
        ? { $addToSet: { pinnedFor: userObjectId } }
        : { $pull: { pinnedFor: userObjectId } };

      const result = await this.messagesRepository.updateMany({
        query: { _id: { $in: messageObjectIds }, space: spaceObjectId },
        dto: update,
      });

      if (result.modifiedCount === 0) {
        throw new InternalServerErrorException('messages.notUpdated');
      }

      return {
        everybody: false,
        pinnedIds: messageIdsArray,
        systemMessage: null,
      };
    }

    const canPin =
      isPrivate ||
      member.role === SpaceMemberRole.OWNER ||
      (member.role === SpaceMemberRole.ADMIN &&
        member.permissions?.includes(SpaceMemberPermission.PIN_ANY_MESSAGE));

    if (!canPin) {
      throw new BadRequestException('messages.notAllowedToPin');
    }

    const result = await this.messagesRepository.updateMany({
      query: { _id: { $in: messageObjectIds }, space: spaceObjectId },
      dto: { isPinned },
    });
    if (result.modifiedCount === 0) {
      throw new InternalServerErrorException('messages.notUpdated');
    }

    const findLastMessage = await this.messagesRepository.findOne({
      query: { _id: messageObjectIds[messageObjectIds?.length - 1] },
    });
    const action = isPinned ? 'pinned' : 'unpinned';
    const messageLabel =
      messageIdsArray.length > 1
        ? `${messageIdsArray.length} messages`
        : `a ${findLastMessage?.content || findLastMessage?.text || 'message'}`;
    const systemText = `${authUser?.name} ${action} ${messageLabel}`;

    const lastMessage = await this.messagesRepository.createOne({
      dto: {
        space: findSpace._id,
        sender: userObjectId,
        messageType: MessageType.SYSTEM,
        status: MessageStatus.SENT,
        content: systemText,
        text: systemText,
      },
    });

    await this.membersRepository.updateMany({
      query: {
        space: spaceObjectId,
        user: { $ne: userObjectId },
      },
      dto: { $inc: { unreadCount: 1 } },
    });

    if (isPrivate) {
      await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { lastMessage: lastMessage._id },
      });
    } else {
      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { lastMessage: lastMessage._id },
      });
    }

    return {
      pinnedObj: {
        everybody: true,
        messages: messageIdsArray,
        isPinned: dto?.isPinned,
        spaceId: spaceObjectId?.toString(),
      },
      systemMessage: {
        ...lastMessage.toObject(),
        id: lastMessage?._id,
        _id: undefined,
        sender: {
          id: authUser?.id,
          name: authUser?.name,
          avatar: authUser?.avatar,
          profileColor: authUser?.profileColor,
        },
      },
    };
  }
}
