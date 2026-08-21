import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionsRepository } from '../../../../../common/modules/iam/sessions/sessions.repository';

@Injectable()
export class GetSingleSessionService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  public async get({ sessionId }) {
    const session = await this.sessionsRepository.findOne({
      query: { _id: sessionId },
      populate: [
        {
          path: 'user',
          model: 'User',
          select: 'name email phone type',
        },
      ],
    });
    if (!session) throw new NotFoundException('sessions.notFound');
    return session;
  }
}
