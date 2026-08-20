import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SessionsRepository } from '../../../../../common/modules/iam/sessions/sessions.repository';
import { ActivationStatus } from '../../../../../common/types/enums';

@Injectable()
export class ActiveSessionService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  public async active({ targetSessionId, currSessionId, authUser }) {
    if (targetSessionId === currSessionId?.toString() || !currSessionId) {
      throw new BadRequestException('sessions.cannotModifyCurrentSession');
    }

    const session = await this.sessionsRepository.updateOne({
      query: { _id: targetSessionId, user: new Types.ObjectId(authUser?._id) },
      dto: { status: ActivationStatus.ACTIVE },
    });

    if (!session) {
      throw new NotFoundException('sessions.notFound');
    }

    return session;
  }
}
