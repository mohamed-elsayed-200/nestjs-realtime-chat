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
import { ReactionsRepository } from '../../../../common/modules/platform/reactions/reactions.repository';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly membersRepository: MembersRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly reactionsRepository: ReactionsRepository,
  ) {}

  public async getAll({ query, messageId, authUser }) {
    const messageObjectId = new Types.ObjectId(messageId);
    const userObjectId = new Types.ObjectId(authUser?._id);

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
          // Lookup reactions for this comment
          {
            $lookup: {
              from: 'reactions',
              let: { commentId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$comment', '$$commentId'] },
                  },
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails',
                  },
                },
                { $unwind: '$userDetails' },
                { $sort: { createdAt: -1 } },
                // Group by emoji
                {
                  $group: {
                    _id: '$emoji',
                    count: { $sum: 1 },
                    users: {
                      $push: {
                        id: '$userDetails._id',
                        name: '$userDetails.name',
                        avatar: '$userDetails.avatar',
                        profileColor: '$userDetails.profileColor',
                      },
                    },
                    // Check if current user reacted with this emoji
                    hasUserReacted: {
                      $sum: {
                        $cond: [
                          { $eq: ['$userDetails._id', userObjectId] },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    emoji: '$_id',
                    count: 1,
                    hasUserReacted: { $gt: ['$hasUserReacted', 0] },
                    recentUsers: { $slice: ['$users', 3] },
                  },
                },
              ],
              as: 'reactions',
            },
          },
          // Convert reactions array to object keyed by emoji
          {
            $addFields: {
              reactionsMap: {
                $arrayToObject: {
                  $map: {
                    input: '$reactions',
                    as: 'reaction',
                    in: {
                      k: '$$reaction.emoji',
                      v: {
                        count: '$$reaction.count',
                        hasUserReacted: '$$reaction.hasUserReacted',
                        recentUsers: '$$reaction.recentUsers',
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              author: 1,
              content: 1,
              parent: 1,
              repliesCount: 1,
              isEdited: 1,
              editedAt: 1,
              createdAt: 1,
              // Use $ifNull to ensure reactions is always an object, never null
              reactions: { $ifNull: ['$reactionsMap', {}] },
            },
          },
        ],
      },
    });
  }
  // get replies for a specific parent comment
  public async getReplies({ query, parentId, authUser }) {
    const userObjectId = new Types.ObjectId(authUser?._id);
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
          // Lookup reactions for this comment
          {
            $lookup: {
              from: 'reactions',
              let: { commentId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$comment', '$$commentId'] },
                  },
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails',
                  },
                },
                { $unwind: '$userDetails' },
                { $sort: { createdAt: -1 } },
                // Group by emoji
                {
                  $group: {
                    _id: '$emoji',
                    count: { $sum: 1 },
                    users: {
                      $push: {
                        id: '$userDetails._id',
                        name: '$userDetails.name',
                        avatar: '$userDetails.avatar',
                        profileColor: '$userDetails.profileColor',
                      },
                    },
                    // Check if current user reacted with this emoji
                    hasUserReacted: {
                      $sum: {
                        $cond: [
                          { $eq: ['$userDetails._id', userObjectId] },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    emoji: '$_id',
                    count: 1,
                    hasUserReacted: { $gt: ['$hasUserReacted', 0] },
                    recentUsers: { $slice: ['$users', 3] },
                  },
                },
              ],
              as: 'reactions',
            },
          },
          // Convert reactions array to object keyed by emoji
          {
            $addFields: {
              reactionsMap: {
                $arrayToObject: {
                  $map: {
                    input: '$reactions',
                    as: 'reaction',
                    in: {
                      k: '$$reaction.emoji',
                      v: {
                        count: '$$reaction.count',
                        hasUserReacted: '$$reaction.hasUserReacted',
                        recentUsers: '$$reaction.recentUsers',
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              author: 1,
              content: 1,
              parent: 1,
              isEdited: 1,
              editedAt: 1,
              createdAt: 1,
              // Use $ifNull to ensure reactions is always an object, never null
              reactions: { $ifNull: ['$reactionsMap', {}] },
            },
          },
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

    await this.messagesRepository.updateOne({
      query: { _id: dto.message },
      dto: { $inc: { commentsCount: 1 } },
    });

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

    // how many comment documents this delete actually removes —
    // 1 for a lone comment/reply, or 1 + repliesCount for a thread with replies
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

      // clean up reactions for the comment itself AND every reply that got cascaded away
      await this.reactionsRepository.deleteMany({
        query: { comment: { $in: [comment._id, ...replyIds] } },
      });
    } else {
      // it's a reply: free up a slot on its parent's counter
      await this.commentsRepository.updateOne({
        query: { _id: comment.parent },
        dto: { $inc: { repliesCount: -1 } },
      });

      // only this reply's own reactions should be removed — never touch the parent's
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
      member.permissions?.includes(SpaceMemberPermission.DELETE_MESSAGES);

    return isOwner || isModeratorAdmin;
  }
}
