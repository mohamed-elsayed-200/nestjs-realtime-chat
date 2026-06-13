import { Injectable, NotFoundException } from '@nestjs/common';
import { ReactionsRepository } from '../../../../common/modules/platform/reactions/reactions.repository';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { Types } from 'mongoose';

@Injectable()
export class ReactionsService {
  constructor(
    private readonly reactionsRepository: ReactionsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async toggleReaction({ dto, authUser }) {
    const { message, emoji } = dto;

    const messageId = new Types.ObjectId(message);
    const userId = new Types.ObjectId(authUser._id);

    const findMessage = await this.messagesRepository.findOne({
      query: { _id: messageId },
    });

    if (!findMessage) throw new NotFoundException('messages.notFound');

    const existingReaction = await this.reactionsRepository.findOne({
      query: {
        message: messageId,
        user: userId,
      },
    });

    let action = 'added';

    if (existingReaction) {
      await this.reactionsRepository.deleteOne({
        query: { _id: existingReaction._id },
      });
      action = 'removed';
    } else {
      await this.reactionsRepository.createOne({
        dto: {
          message: messageId,
          user: userId,
          emoji: emoji,
        },
      });
      action = 'added';
    }

    return {
      messageId,
      emoji,
      action,
    };
  }
}
