import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CommentsRepository } from '../../../../common/modules/platform/comments/comments.repository';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import {
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../common/types/enums';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly membersRepository: MembersRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  // get all top-level comments for a message (replies are fetched separately)
  public async getAll({ query, messageId }) {
    const messageObjectId = new Types.ObjectId(messageId);
    return this.commentsRepository.findAll({
      query,
      options: {
        pipelines: [
          { $match: { message: messageObjectId, parent: null } },
          {
            $lookup: {
              from: 'users',
              localField: 'author',
              foreignField: '_id',
              as: 'author',
              pipeline: [
                {
                  $project: {
                    name: 1,
                    username: 1,
                    profileColor: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              author: 1,
              content: 1,
              parent: 1,
              reactionsCount: 1,
              repliesCount: 1,
              isEdited: 1,
              editedAt: 1,
              createdAt: 1,
            },
          },
          { $sort: { createdAt: -1 } },
        ],
      },
    });
  }

  // get replies for a specific parent comment
  public async getReplies({ query, parentId }) {
    const parentObjectId = new Types.ObjectId(parentId);
    return this.commentsRepository.findAll({
      query,
      options: {
        pipelines: [
          { $match: { parent: parentObjectId } },
          {
            $lookup: {
              from: 'users',
              localField: 'author',
              foreignField: '_id',
              as: 'author',
              pipeline: [
                {
                  $project: {
                    name: 1,
                    username: 1,
                    profileColor: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              author: 1,
              content: 1,
              parent: 1,
              reactionsCount: 1,
              isEdited: 1,
              editedAt: 1,
              createdAt: 1,
            },
          },
          { $sort: { createdAt: 1 } }, // replies read oldest -> newest
        ],
      },
    });
  }

  // get comment by id
  public async getOne({ commentId }) {
    const comment = await this.commentsRepository.findOne({
      query: { _id: commentId },
    });
    if (!comment) throw new NotFoundException('comments.notFound');
    return comment;
  }

  // create comment — validates parent when replying
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

    return newComment;
  }

  // a reply can only target a top-level comment on the same message,
  // and replies cannot be nested more than one level deep
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

  // update comment
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

  // delete comment — hard delete; cascades to replies if it's a top-level comment
  public async delete({ commentId, authUser }) {
    const comment = await this.commentsRepository.findOne({
      query: { _id: commentId },
    });
    if (!comment) throw new NotFoundException('comments.notFound');

    const isAuthor = comment.author.toString() === authUser._id.toString();
    const canModerate =
      isAuthor || (await this.canModerateComment(comment, authUser._id));

    if (!canModerate) {
      throw new ForbiddenException('comments.notAllowed');
    }

    // top-level comment: wipe its replies too, so nothing is left orphaned
    if (!comment.parent) {
      await this.commentsRepository.deleteMany({
        query: { parent: comment._id },
      });
    } else {
      // it's a reply: free up a slot on its parent's counter
      await this.commentsRepository.updateOne({
        query: { _id: comment.parent },
        dto: { $inc: { repliesCount: -1 } },
      });
    }

    const deleted = await this.commentsRepository.deleteOne({
      query: { _id: commentId },
    });
    if (!deleted) throw new NotFoundException('comments.notDeleted');

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
      member.permissions?.includes(SpaceMemberPermission.DELETE_MESSAGES);

    return isOwner || isModeratorAdmin;
  }
}
