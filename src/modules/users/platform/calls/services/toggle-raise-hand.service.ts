import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';
import { ParticipantsRepository } from '../../../../../common/modules/platform/calls/participants.repository';
import { CallScope } from '../../../../../common/types/enums';

@Injectable()
export class ToggleRaiseHandService {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
  ) {}

  public async toggle({ dto, authUser }) {
    const { callId } = dto;
    const callObjectId = new Types.ObjectId(callId);
    const authUserObjectId = new Types.ObjectId(authUser._id);

    const call = await this.callsRepository.findOne({
      query: { _id: callObjectId },
    });
    if (!call) throw new NotFoundException('Call not found');

    if (call.scope === CallScope.PRIVATE) {
      throw new BadRequestException(
        'Raise hand is only available in group calls',
      );
    }

    const participant = await this.participantsRepository.findOne({
      query: { call: callObjectId, user: authUserObjectId },
    });
    if (!participant) {
      throw new NotFoundException('You are not in this call');
    }

    const updatedParticipant = await this.participantsRepository.updateOne({
      query: { _id: participant._id },
      dto: {
        isHandRaised: !participant.isHandRaised,
        handRaisedCount: participant.isHandRaised
          ? participant.handRaisedCount
          : (participant.handRaisedCount ?? 0) + 1,
        lastInteractionAt: new Date(),
      },
    });

    return {
      call: this.callsRepository.toCallResponse(call),
      participant:
        this.callsRepository.toParticipantResponse(updatedParticipant),
    };
  }
}
