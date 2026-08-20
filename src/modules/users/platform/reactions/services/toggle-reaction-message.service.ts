import { Injectable, NotFoundException } from '@nestjs/common';
import { ReactionsRepository } from '../../../../../common/modules/platform/reactions/reactions.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { Types } from 'mongoose';

@Injectable()
export class ToggleReactionMessageService {
  constructor(
    private readonly reactionsRepository: ReactionsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async toggle({ dto, authUser }) {
    const { message, emoji } = dto;

    const messageId = new Types.ObjectId(message);
    const userId = new Types.ObjectId(authUser._id);

    const findMessage = await this.messagesRepository.findOne({
      query: { _id: messageId },
    });

    if (!findMessage) throw new NotFoundException('messages.notFound');

    // Use findOneAndUpdate with upsert for atomic operation
    const existingReaction = await this.reactionsRepository.findOne({
      query: {
        message: messageId,
        user: userId,
      },
    });

    let action = 'added';

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Same emoji -> delete
        await this.reactionsRepository.deleteOne({
          query: { _id: existingReaction._id },
        });
        action = 'removed';
      } else {
        // Different emoji -> update
        await this.reactionsRepository.updateOne({
          query: { _id: existingReaction._id },
          dto: { emoji },
        });
        action = 'updated';
      }
    } else {
      // Create new reaction
      await this.reactionsRepository.createOne({
        dto: {
          message: messageId,
          user: userId,
          emoji,
        },
      });
      action = 'added';
    }

    return {
      messageId: messageId.toString(),
      emoji,
      action,
      spaceId: dto.space,
      user: {
        id: authUser?.id,
        name: authUser?.name,
        profileColor: authUser?.profileColor,
        avatar: authUser?.avatar,
      },
    };
  }
}
