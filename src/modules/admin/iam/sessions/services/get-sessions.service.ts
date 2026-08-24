import { Injectable } from '@nestjs/common';
import { SessionsRepository } from '../../../../../common/modules/iam/sessions/sessions.repository';

@Injectable()
export class GetSessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}
  public async get({ query }) {
    return this.sessionsRepository.findAllByPaginate({
      query,
      options: {
        allowedSearchFields: ['ip', 'user', 'userAgent'],
        allowedFilterFields: ['status'],
        pipelines: [
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'userDoc',
            },
          },
          {
            $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true },
          },
          {
            $project: {
              user: {
                name: '$userDoc.name',
                profileColor: '$userDoc.profileColor',
                avatar: '$userDoc.avatar',
                email: '$userDoc.email',
                username: '$userDoc.username',
              },
              ip: 1,
              userAgent: 1,
              location: 1,
              status: 1,
              expiresIn: 1,
              lastUsedAt: 1,
            },
          },
        ],
      },
    });
  }
}
