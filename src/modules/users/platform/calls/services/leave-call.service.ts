import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';
import { ParticipantsRepository } from '../../../../../common/modules/platform/calls/participants.repository';
import { ParticipantStatus } from '../../../../../common/types/enums';
import { EndCallService } from './end-call.service';

@Injectable()
export class LeaveCallService {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
    private readonly endCallService: EndCallService,
  ) {}

  public async leave({ dto, authUser }) {
    const callObjectId = new Types.ObjectId(dto.callId);
    const authUserObjectId = new Types.ObjectId(authUser._id);

    const call = await this.callsRepository.findOne({
      query: { _id: callObjectId },
    });

    if (!call) throw new NotFoundException('Call not found');

    const participant = await this.participantsRepository.findOne({
      query: { call: callObjectId, user: authUserObjectId },
    });
    if (!participant) {
      throw new NotFoundException('You are not part of this call');
    }

    const updatedParticipant = await this.participantsRepository.updateOne({
      query: { _id: participant._id },
      dto: {
        status: ParticipantStatus.LEFT,
        leftAt: new Date(),
      },
    });

    const remaining = await this.participantsRepository.findOne({
      query: {
        call: callObjectId,
        status: ParticipantStatus.CONNECTED,
      },
    });

    if (!remaining) {
      const endResult = await this.endCallService.end({
        dto: { callId: callObjectId },
        authUser,
      });

      return {
        call: endResult.call,
        participant:
          this.callsRepository.toParticipantResponse(updatedParticipant),
        participants: endResult.participants,
        systemMessage: endResult.systemMessage,
      };
    }

    const updatedCall = await this.callsRepository.updateOne({
      query: { _id: callObjectId },
      dto: { $inc: { participantsCount: -1 } },
    });

    return {
      call: this.callsRepository.toCallResponse(updatedCall),
      participant:
        this.callsRepository.toParticipantResponse(updatedParticipant),
      participants: undefined,
      systemMessage: undefined,
    };
  }
}
