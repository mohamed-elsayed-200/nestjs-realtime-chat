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
export class EndCallService {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async end({ dto, authUser }) {
    const callObjectId = new Types.ObjectId(dto.callId);
    const authUserObjectId = new Types.ObjectId(authUser._id);

    const call = await this.callsRepository.findOne({
      query: { _id: callObjectId },
    });
    if (!call) throw new NotFoundException('Call not found');

    if (
      [CallStatus.COMPLETED, CallStatus.FAILED, CallStatus.MISSED].includes(
        call?.status,
      )
    ) {
      return { call: this.callsRepository.toCallResponse(call) };
    }

    const endedAt = new Date();
    const wasStarted = !!call?.startedAt;
    const startedAt = wasStarted ? new Date(call.startedAt) : endedAt;
    const duration = wasStarted
      ? Math.max(
          0,
          Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
        )
      : 0;

    const isPrivate = call?.scope === CallScope.PRIVATE;
    const finalStatus =
      isPrivate && !wasStarted ? CallStatus.MISSED : CallStatus.COMPLETED;

    const updatedCall = await this.callsRepository.updateOne({
      query: { _id: callObjectId },
      dto: {
        status: finalStatus,
        endedAt,
        endedBy: authUserObjectId,
        duration,
      },
    });
    const affectedParticipants = await this.participantsRepository.updateMany({
      query: {
        call: callObjectId,
        status: {
          $in: [ParticipantStatus.INVITED, ParticipantStatus.CONNECTED],
        },
      },
      dto: {
        status: ParticipantStatus.LEFT,
        leftAt: endedAt,
      },
    });

    const text = buildCallSystemMessageText({
      type: call?.type,
      scope: call?.scope,
      status: finalStatus,
      duration,
    });

    const systemMessage = await this.messagesRepository.createOne({
      dto: {
        space: call?.space?._id ?? call?.space,
        sender: authUserObjectId,
        messageType:
          finalStatus === CallStatus.MISSED
            ? MessageType.CALL_MISSED
            : MessageType.CALL_ENDED,
        status: MessageStatus.SENT,
        duration,
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
      participants: affectedParticipants.map(
        this.callsRepository.toParticipantResponse,
      ),
      systemMessage: {
        ...systemMessage.toObject(),
        id: systemMessage._id.toString(),
        _id: undefined,
      },
    };
  }
}
