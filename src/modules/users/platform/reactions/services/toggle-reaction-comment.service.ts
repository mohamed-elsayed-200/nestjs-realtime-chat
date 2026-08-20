import { Injectable, NotFoundException } from '@nestjs/common';
import { ReactionsRepository } from '../../../../../common/modules/platform/reactions/reactions.repository';
import { CommentsRepository } from '../../../../../common/modules/platform/comments/comments.repository';
import { Types } from 'mongoose';

@Injectable()
export class ToggleReactionCommentService {
  constructor(
    private readonly reactionsRepository: ReactionsRepository,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  public async toggle({ dto, authUser }) {
    const { comment, emoji } = dto;

    const commentId = new Types.ObjectId(comment);
    const userId = new Types.ObjectId(authUser._id);

    const findMessage = await this.commentsRepository.findOne({
      query: { _id: commentId },
    });

    if (!findMessage) throw new NotFoundException('comments.notFound');

    // Use findOneAndUpdate with upsert for atomic operation
    const existingReaction = await this.reactionsRepository.findOne({
      query: {
        comment: commentId,
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
          comment: commentId,
          user: userId,
          emoji,
        },
      });
      action = 'added';
    }

    return {
      commentId: commentId.toString(),
      emoji,
      action,
    };
  }
}
