import { Injectable } from '@nestjs/common';
import { SessionsRepository } from '../../../../../common/modules/iam/sessions/sessions.repository';

@Injectable()
export class GetSessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}
  public async get({ query }) {
    return this.sessionsRepository.findAllByPaginate({
      query,
      options: {
        modelActions: {
          populate: [
            {
              path: 'user',
              model: 'User',
              select: 'name email phone type',
            },
          ],
        },
        allowedSearchFields: ['name'],
      },
    });
  }
}
