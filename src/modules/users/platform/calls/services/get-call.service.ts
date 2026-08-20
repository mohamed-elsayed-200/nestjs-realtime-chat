import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';
import { ParticipantsRepository } from '../../../../../common/modules/platform/calls/participants.repository';
import { ParticipantStatus } from '../../../../../common/types/enums';

@Injectable()
export class GetCallService {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
  ) {}

  public async getCallById({ callId, authUser }) {
    const userObjectId = new Types.ObjectId(authUser);
    const callObjectId = new Types.ObjectId(new Types.ObjectId(callId));
    const call = await this.callsRepository.findOne({
      query: { _id: callObjectId },
    });
    if (!call) throw new NotFoundException('Call not found');

    const participants = await this.participantsRepository.findMany({
      query: {
        call: call._id,
        status: {
          $in: [
            ParticipantStatus.CONNECTED,
            ParticipantStatus.SPEAKING,
            ParticipantStatus.PRESENTER,
          ],
        },
      },
    });

    return {
      call: this.callsRepository.toCallResponse(call),
      participants: participants.map(
        this.callsRepository.toParticipantResponse,
      ),
    };
  }
}
