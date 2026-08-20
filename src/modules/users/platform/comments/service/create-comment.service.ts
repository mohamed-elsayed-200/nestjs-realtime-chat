import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CommentsRepository } from '../../../../../common/modules/platform/comments/comments.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';

@Injectable()
export class CreateCommentService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async create({ dto, authUser }) {
    let space: Types.ObjectId;

    if (dto.parent) {
      const parent = await this.validateParent(dto.parent, dto.message);
      space = parent.space;
    } else {
      const message = await this.messagesRepository.findOne({
        query: { _id: dto.message },
      });
      if (!message) throw new NotFoundException('messages.notFound');
      space = message.space;
    }

    const newComment = await this.commentsRepository.createOne({
      dto: { ...dto, author: authUser._id, space },
    });
    if (!newComment) {
      throw new InternalServerErrorException('comments.notCreated');
    }

    if (dto.parent) {
      await this.commentsRepository.updateOne({
        query: { _id: dto.parent },
        dto: { $inc: { repliesCount: 1 } },
      });
    }

    await this.messagesRepository.updateOne({
      query: { _id: dto.message },
      dto: { $inc: { commentsCount: 1 } },
    });

    return newComment;
  }

  private async validateParent(parentId: string, messageId: string) {
    const parent = await this.commentsRepository.findOne({
      query: { _id: parentId },
    });
    if (!parent) throw new NotFoundException('comments.parentNotFound');

    if (parent.message.toString() !== messageId) {
      throw new BadRequestException('comments.parentMessageMismatch');
    }

    if (parent.parent) {
      throw new BadRequestException('comments.nestingNotAllowed');
    }

    return parent;
  }
}
