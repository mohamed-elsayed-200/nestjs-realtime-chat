import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SessionsRepository } from '../../../../common/modules/iam/sessions/sessions.repository';
import { ActivationStatus } from '../../../../common/types/enums';

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}
  public async getAll({ authUser, currSessionId }) {
    const sessions = await this.sessionsRepository.findAll({
      query: { user: new Types.ObjectId(authUser) },
    });

    return sessions?.map((s) =>
      s?._id?.toString() === currSessionId?.toString()
        ? { ...s.toObject(), isCurrent: true }
        : s,
    );
  }

  public async getOne({ sessionId }) {
    const session = await this.sessionsRepository.findOne({
      query: { _id: sessionId },
    });
    if (!session) throw new NotFoundException('sessions.notFound');
    return session;
  }

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
