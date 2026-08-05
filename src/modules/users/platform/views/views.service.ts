import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ViewTargetType } from '../../../../common/types/enums';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { ViewsRepository } from '../../../../common/modules/platform/views/views.repository';

@Injectable()
export class ViewsService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly viewsRepository: ViewsRepository,
  ) {}

  public async getAll({ query, target }) {
    const targetObjectId = new Types.ObjectId(target);
    return this.viewsRepository.findAll({
      query,
      options: {
        allowedFilterFields: ['targetType'],
        pipelines: [
          {
            $match: { target: targetObjectId },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              id: '$user._id',
              name: '$user.name',
              profileColor: '$user.profileColor',
              avatar: '$user.avatar',
              username: '$user.username',
            },
          },
        ],
      },
    });
  }

  public async viewMessage({ dto }) {
    const userObjectId = new Types.ObjectId(dto?.user);
    const messageObjectId = new Types.ObjectId(dto?.message);

    const isViewed = await this.viewsRepository.findOne({
      query: {
        target: messageObjectId,
        targetType: ViewTargetType.MESSAGE,
        user: userObjectId,
      },
    });

    if (isViewed) return { view: isViewed };

    const newView = await this.viewsRepository.createOne({
      dto: {
        target: messageObjectId,
        targetType: ViewTargetType.MESSAGE,
        user: userObjectId,
      },
    });
    if (!newView) return;

    const updated = await this.messagesRepository.updateOne({
      query: { _id: messageObjectId },
      dto: { $inc: { viewCount: 1 } },
    });

    return { message: updated };
  }
}
