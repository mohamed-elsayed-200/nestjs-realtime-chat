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
export class ToggleParticipantMuteService {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
  ) {}

  public async toggle({ dto, authUser }) {
    const { callId, targetUserId } = dto;
    const callObjectId = new Types.ObjectId(callId);
    const authUserObjectId = new Types.ObjectId(authUser._id);

    const call = await this.callsRepository.findOne({
      query: { _id: callObjectId },
    });
    if (!call) throw new NotFoundException('Call not found');

    const actorParticipant = await this.participantsRepository.findOne({
      query: { call: callObjectId, user: authUserObjectId },
    });
    if (!actorParticipant) {
      throw new NotFoundException('You are not in this call');
    }

    const targetUserObjectId = targetUserId
      ? new Types.ObjectId(targetUserId)
      : authUserObjectId;

    const targetParticipant = await this.participantsRepository.findOne({
      query: { call: callObjectId, user: targetUserObjectId },
    });
    if (!targetParticipant) {
      throw new NotFoundException('Target participant not found');
    }

    const isSelf =
      targetUserObjectId.toString() === authUserObjectId.toString();

    if (!isSelf) {
      if (call.scope === CallScope.PRIVATE) {
        throw new BadRequestException('Cannot mute others in private calls');
      }

      const canMuteOthers = ['host', 'co-host'].includes(
        actorParticipant.callRole,
      );
      if (!canMuteOthers) {
        throw new BadRequestException('Only hosts can mute participants');
      }
    }

    const updatedParticipant = await this.participantsRepository.updateOne({
      query: { _id: targetParticipant._id },
      dto: { isMuted: !targetParticipant.isMuted },
    });

    return {
      call: this.callsRepository.toCallResponse(call),
      participant:
        this.callsRepository.toParticipantResponse(updatedParticipant),
      targetUserId: targetUserObjectId.toString(),
      isMuted: updatedParticipant.isMuted,
    };
  }
}
