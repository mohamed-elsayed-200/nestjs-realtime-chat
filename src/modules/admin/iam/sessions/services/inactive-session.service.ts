import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionsRepository } from '../../../../../common/modules/iam/sessions/sessions.repository';
import { ActivationStatus } from '../../../../../common/types/enums';

@Injectable()
export class InactiveSessionService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

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
}
