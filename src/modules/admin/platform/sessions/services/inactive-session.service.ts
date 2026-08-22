import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SessionsRepository } from '../../../../../common/modules/iam/sessions/sessions.repository';

@Injectable()
export class InactiveSessionService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}
  public async inactive({ targetSessionId, currSessionId, authUser }) {
    if (targetSessionId === currSessionId?.toString() || !currSessionId) {
      throw new BadRequestException('sessions.cannotModifyCurrentSession');
    }

    const session = await this.sessionsRepository.deleteOne({
      query: { _id: targetSessionId, user: new Types.ObjectId(authUser?._id) },
    });

    if (!session) {
      throw new NotFoundException('sessions.notFound');
    }

    return session;
  }
}
