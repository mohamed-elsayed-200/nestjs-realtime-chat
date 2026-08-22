import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';
import { ParticipantsRepository } from '../../../../../common/modules/platform/calls/participants.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import {
  CallScope,
  CallStatus,
  MessageStatus,
  MessageType,
  ParticipantStatus,
} from '../../../../../common/types/enums';
import { buildCallSystemMessageText } from '../../../../../common/utils/call-message-text';

@Injectable()
export class RejectCallService {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
    private readonly membersRepository: MembersRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async reject({ dto, authUser }) {
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
      throw new NotFoundException('You are not invited to this call');
    }

    await this.participantsRepository.updateOne({
      query: { _id: participant._id },
      dto: { status: ParticipantStatus.REJECTED },
    });

    if (call?.scope === CallScope.PRIVATE) {
      const updatedCall = await this.callsRepository.updateOne({
        query: { _id: callObjectId },
        dto: {
          status: CallStatus.REJECTED,
          endedAt: new Date(),
          endedBy: authUserObjectId,
        },
      });

      const text = buildCallSystemMessageText({
        type: updatedCall.type,
        scope: updatedCall.scope,
        status: CallStatus.REJECTED,
      });

      const systemMessage = await this.messagesRepository.createOne({
        dto: {
          space: call?.space?._id ?? call?.space,
          sender: authUserObjectId,
          messageType: MessageType.CALL_REJECTED,
          status: MessageStatus.SENT,
          duration: call?.duration,
          content: text,
          text,
        },
      });

      await this.membersRepository.updateMany({
        query: { space: call?.space?._id ?? call?.space },
        dto: { lastMessage: systemMessage?._id },
      });

      return {
        call: this.callsRepository.toCallResponse(updatedCall),
        systemMessage: {
          ...systemMessage.toObject(),
          id: systemMessage._id.toString(),
          _id: undefined,
        },
      };
    }

    return { call: this.callsRepository.toCallResponse(call) };
  }
}
