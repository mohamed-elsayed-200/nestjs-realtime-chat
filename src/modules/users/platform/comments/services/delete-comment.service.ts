import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CommentsRepository } from '../../../../../common/modules/platform/comments/comments.repository';
import { ReactionsRepository } from '../../../../../common/modules/platform/reactions/reactions.repository';
import {
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../../common/types/enums';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class DeleteCommentService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly reactionsRepository: ReactionsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async delete({ commentId, authUser }) {
    const comment = await this.commentsRepository.findOne({
      query: { _id: commentId },
    });
    if (!comment) throw new NotFoundException('comments.notFound');

    const isAuthor = comment.author.toString() === authUser._id.toString();
    const canModerate =
      isAuthor || (await this.canModerateComment(comment, authUser._id));

    if (!canModerate) {
      throw new BadRequestException('comments.notAllowed');
    }

    let removedCount = 1;

    if (!comment.parent) {
      const replies = await this.commentsRepository.findMany({
        query: { parent: comment._id },
        select: '_id',
      });
      const replyIds = replies.map((r) => r._id);
      removedCount += replyIds.length;

      await this.commentsRepository.deleteMany({
        query: { parent: comment._id },
      });

      await this.reactionsRepository.deleteMany({
        query: { comment: { $in: [comment._id, ...replyIds] } },
      });
    } else {
      await this.commentsRepository.updateOne({
        query: { _id: comment.parent },
        dto: { $inc: { repliesCount: -1 } },
      });

      await this.reactionsRepository.deleteMany({
        query: { comment: comment._id },
      });
    }

    const deleted = await this.commentsRepository.deleteOne({
      query: { _id: commentId },
    });
    if (!deleted) throw new NotFoundException('comments.notDeleted');

    await this.messagesRepository.updateOne({
      query: { _id: comment.message },
      dto: { $inc: { commentsCount: -removedCount } },
    });

    return deleted;
  }

  private async canModerateComment(comment, requesterId: Types.ObjectId) {
    const member = await this.membersRepository.findOne({
      query: { space: comment.space, user: requesterId },
    });
    if (!member) return false;

    const isOwner = member.role === SpaceMemberRole.OWNER;
    const isModeratorAdmin =
      member.role === SpaceMemberRole.ADMIN &&
      member.permissions?.includes(SpaceMemberPermission.DELETE_ANY_COMMENT);

    return isOwner || isModeratorAdmin;
  }
}
