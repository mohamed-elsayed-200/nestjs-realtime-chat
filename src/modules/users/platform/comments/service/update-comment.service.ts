import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CommentsRepository } from '../../../../../common/modules/platform/comments/comments.repository';

@Injectable()
export class UpdateCommentService {
  constructor(private readonly commentsRepository: CommentsRepository) {}
  public async update({ commentId, dto, authUser }) {
    const comment = await this.commentsRepository.updateOne({
      query: { _id: commentId, author: authUser._id },
      dto: {
        ...dto,
        isEdited: true,
        editedAt: new Date(),
      },
    });
    if (!comment) throw new NotFoundException('comments.notFound');
    return comment;
  }
}
