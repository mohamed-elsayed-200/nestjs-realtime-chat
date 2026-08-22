import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { SessionsRepository } from '../../../../../common/modules/iam/sessions/sessions.repository';

@Injectable()
export class GetSessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}
  public async get({ authUser, currSessionId }) {
    const sessions = await this.sessionsRepository.findAll({
      query: { user: new Types.ObjectId(authUser) },
    });

    return sessions?.map((s) =>
      s?._id?.toString() === currSessionId?.toString()
        ? { ...s.toObject(), isCurrent: true }
        : s,
    );
  }
}
