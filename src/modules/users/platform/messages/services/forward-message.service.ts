import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  MessageStatus,
  SpaceMemberPermission,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class ForwardMessageService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async forward({ dto, authUser }) {
    const { messages, targetSpace } = dto;
    const userObjectId = new Types.ObjectId(authUser?._id);
    const targetSpaceObjectId = new Types.ObjectId(targetSpace);

    const findMember: any = await this.membersRepository.findOne({
      query: {
        user: userObjectId,
        space: targetSpaceObjectId,
      },
      populate: [
        {
          path: 'space',
          model: 'Space',
          select: 'status type',
        },
      ],
    });

    if (!findMember) throw new NotFoundException('spaces.notFound');

    const isPrivate = findMember.space.type === SpaceTypes.PRIVATE;
    const isAdminOrOwner =
      findMember.role === SpaceMemberRole.ADMIN ||
      findMember.role === SpaceMemberRole.OWNER;

    if (!isPrivate) {
      const canSendMessages = findMember.permissions?.includes(
        SpaceMemberPermission.SEND_MESSAGES,
      );

      if (!canSendMessages && !isAdminOrOwner) {
        throw new BadRequestException('spaces.noPermissionToSendMessages');
      }

      if (
        findMember.space.type === SpaceTypes.CHANNEL &&
        findMember.role === SpaceMemberRole.MEMBER
      ) {
        throw new BadRequestException('channels.onlyAdminsCanForward');
      }
    }

    const originalMessages = await this.messagesRepository.findMany({
      query: {
        _id: { $in: messages },
      },
    });

    if (originalMessages.length === 0) {
      throw new NotFoundException('messages.notFound');
    }

    const messagesToInsert = originalMessages.map((originalMessage) => ({
      space: targetSpaceObjectId,
      sender: userObjectId,
      messageType: originalMessage.messageType,
      content: originalMessage.content,
      text: originalMessage.text,
      forwardFrom: originalMessage.sender,
      albumFiles: originalMessage.albumFiles,
      mimeType: originalMessage.mimeType,
      status: MessageStatus.SENT,
      createdAt: new Date(),
    }));

    const insertedMessages = await this.messagesRepository.insertMany({
      documents: messagesToInsert,
    });

    const lastForwardedMessage = insertedMessages[insertedMessages.length - 1];
    const lastMessageId = new Types.ObjectId(
      lastForwardedMessage._id?.toString(),
    );

    if (isPrivate) {
      await this.membersRepository.updateMany({
        query: { space: targetSpaceObjectId },
        dto: { lastMessage: lastMessageId },
      });
    } else if (findMember?.space?.type !== SpaceTypes.COMMUNITY) {
      await this.spacesRepository.updateOne({
        query: { _id: targetSpaceObjectId },
        dto: { lastMessage: lastMessageId },
      });
    }

    const insertedIds = insertedMessages.map((m) => m._id);
    const forwardedMessages = await this.messagesRepository.findMany({
      query: { _id: { $in: insertedIds } },
      populate: [
        { path: 'sender', model: 'User', select: 'name avatar profileColor' },
        {
          path: 'forwardFrom',
          model: 'User',
          select: 'name avatar profileColor',
        },
      ],
    });

    const format = forwardedMessages.map((msg: any) => {
      msg.id = msg._id?.toString();
      delete msg._id;
      delete msg.__v;

      if (msg.space) {
        msg.space = msg.space?.toString?.() || msg.space;
      }

      if (msg.sender && typeof msg.sender === 'object') {
        const sender =
          typeof msg.sender.toObject === 'function'
            ? msg.sender.toObject()
            : { ...msg.sender };
        sender.id = sender._id?.toString();
        delete sender._id;
        delete sender.__v;
        msg.sender = sender;
      }

      if (msg.forwardFrom && typeof msg.forwardFrom === 'object') {
        const forwardFrom =
          typeof msg.forwardFrom.toObject === 'function'
            ? msg.forwardFrom.toObject()
            : { ...msg.forwardFrom };
        forwardFrom.id = forwardFrom._id?.toString();
        delete forwardFrom._id;
        delete forwardFrom.__v;
        msg.forwardFrom = forwardFrom;
      }

      return msg;
    });

    return format;
  }
}
