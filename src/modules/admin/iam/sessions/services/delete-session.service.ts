import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionsRepository } from '../../../../../common/modules/iam/sessions/sessions.repository';

@Injectable()
export class DeleteSessionService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

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
