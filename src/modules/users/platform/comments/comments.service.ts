import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CommentsRepository } from '../../../../common/modules/platform/comments/comments.repository';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
import {
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../common/types/enums';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  // get all comments
  public async getAll({ query, messageId }) {
    const messageObjectId = new Types.ObjectId(messageId);
    return this.commentsRepository.findAll({
      query,
      options: {
        pipelines: [
          {
            $match: {
              message: messageObjectId,
            },
          },
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
        ],
      },
    });
  }

  // get all replies
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
        ],
      },
    });
  }

  // get comment by id
  public async getOne({ commentId }) {
    const findComment = await this.commentsRepository.findOne({
      query: { _id: commentId },
    });

    if (!findComment) throw new NotFoundException('comments.notFound');

    return findComment;
  }

  // create comment
  public async create({ dto, authUser }) {
    const newComment = await this.commentsRepository.createOne({
      dto: {
        ...dto,
        author: authUser._id,
      },
    });
    if (!newComment)
      throw new InternalServerErrorException('comments.notCreated');
    return newComment;
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

  // delete comment
  public async delete({ commentId, authUser }) {
    const findComment = await this.commentsRepository.findOne({
      query: { _id: commentId },
    });
    if (!findComment) throw new NotFoundException('comments.notFound');

    const findMember = await this.membersRepository.findOne({
      query: {
        space: findComment.space,
        user: authUser?._id,
      },
    });

    const isOwner = findMember.role === SpaceMemberRole.OWNER;
    const isAdmin =
      findMember.role === SpaceMemberRole.OWNER &&
      findMember.permissions.includes(SpaceMemberPermission.DELETE_MESSAGES);

    if (isOwner || isAdmin) {
      const deleteComment = await this.commentsRepository.deleteOne({
        query: { _id: commentId },
      });
      if (!deleteComment) throw new NotFoundException('comments.notDeleted');
      return deleteComment;
    } else {
      const deleteComment = await this.commentsRepository.deleteOne({
        query: { _id: commentId, author: authUser._id },
      });
      if (!deleteComment) throw new NotFoundException('comments.notDeleted');
      return deleteComment;
    }
  }
}
