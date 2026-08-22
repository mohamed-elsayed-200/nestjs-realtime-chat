import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ViewsRepository } from '../../../../../common/modules/platform/views/views.repository';

@Injectable()
export class GetViewsService {
  constructor(private readonly viewsRepository: ViewsRepository) {}

  public async get({ query, target }) {
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
}
