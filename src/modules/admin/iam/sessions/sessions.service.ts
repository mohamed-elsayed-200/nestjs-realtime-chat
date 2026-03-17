import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SessionsRepository } from '../../../../common/modules/iam/sessions/sessions.repository';
import { User } from '../../../../common/modules/iam/users/user.schema';
import { ActivationStatus } from '../../../../common/types/enums';

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}
  public async getAll({ query }) {
    return this.sessionsRepository.findAllByPaginate({
      query,
      options: {
        modelActions: {
          populate: [
            {
              path: 'user',
              model: User.name,
              select: 'name email phone type',
            },
          ],
        },
        allowedSearchFields: ['name'],
      },
    });
  }

  public async getOne({ sessionId }) {
    const session = await this.sessionsRepository.findOne({
      query: { _id: sessionId },
      populate: [
        {
          path: 'user',
          model: User.name,
          select: 'name email phone type',
        },
      ],
    });
    if (!session) throw new NotFoundException('sessions.notFound');
    return session;
  }

  public async active({ sessionId, currSessionId }) {
    if (sessionId === currSessionId?.toString() || !currSessionId) {
      throw new ForbiddenException('sessions.cannotModifyCurrentSession');
    }

    const session = await this.sessionsRepository.updateOne({
      query: { _id: sessionId },
      dto: { status: ActivationStatus.ACTIVE },
    });

    if (!session) {
      throw new NotFoundException('sessions.notFound');
    }

    return session;
  }

  public async inactive({ sessionId, currSessionId }) {
    if (sessionId === currSessionId?.toString() || !currSessionId) {
      throw new ForbiddenException('sessions.cannotModifyCurrentSession');
    }

    const session = await this.sessionsRepository.updateOne({
      query: { _id: sessionId },
      dto: { status: ActivationStatus.INACTIVE },
    });

    if (!session) {
      throw new NotFoundException('sessions.notFound');
    }

    return session;
  }

  public async delete({ sessionId, currSessionId }) {
    if (sessionId === currSessionId?.toString() || !currSessionId) {
      throw new ForbiddenException('sessions.cannotDeleteCurrentSession');
    }
    const session = await this.sessionsRepository.deleteOne({
      query: { _id: sessionId },
    });
    if (!session) throw new NotFoundException('sessions.notFound');
    return session;
  }
}
