import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CommentsRepository } from '../../../../../common/modules/platform/comments/comments.repository';

@Injectable()
export class GetCommentService {
  constructor(private readonly commentsRepository: CommentsRepository) {}
  public async getOne({ commentId }) {
    const comment = await this.commentsRepository.findOne({
      query: { _id: commentId },
    });
    if (!comment) throw new NotFoundException('comments.notFound');
    return comment;
  }
}
