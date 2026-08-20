import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  MessageStatus,
  MessageType,
  SpaceTypes,
} from '../../../../../common/types/enums';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class UpdateMessageService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async update({ dto, authUser }) {
    const senderId = new Types.ObjectId(authUser?._id);

    const existingMessage = await this.messagesRepository.findOne({
      query: { _id: dto?.message, sender: senderId },
    });
    if (!existingMessage) throw new NotFoundException('messages.notFound');

    const spaceId = new Types.ObjectId(existingMessage.space.toString());

    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFoundOne');

    const isPrivate = findSpace.type === SpaceTypes.PRIVATE;

    const message = await this.messagesRepository.updateOne({
      query: { _id: dto?.message, sender: senderId },
      dto: { ...dto, isEdited: true },
    });
    if (!message) throw new NotFoundException('messages.notUpdated');

    const messageObjectId = new Types.ObjectId(message._id.toString());

    if (findSpace?.lastMessage === message?._id) {
      if (isPrivate) {
        await this.membersRepository.updateMany({
          query: { space: spaceId },
          dto: { lastMessage: messageObjectId },
        });
      } else {
        await this.spacesRepository.updateOne({
          query: { _id: spaceId },
          dto: { lastMessage: messageObjectId },
        });
      }
    }

    return {
      ...message.toObject(),
      id: message?._id,
      _id: undefined,
    };
  }
}
