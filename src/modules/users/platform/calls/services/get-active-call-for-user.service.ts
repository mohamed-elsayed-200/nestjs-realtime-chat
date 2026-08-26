import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';
import { ParticipantsRepository } from '../../../../../common/modules/platform/calls/participants.repository';
import {
  BUSY_CALL_STATUSES,
  CallStatus,
  ParticipantStatus,
} from '../../../../../common/types/enums';

@Injectable()
export class GetActiveCallService {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
  ) {}

  public async get({ authUser }) {
    const authUserObjectId = new Types.ObjectId(authUser._id);
    const authUserId = authUser._id.toString();

    const myParticipants = await this.participantsRepository.findMany({
      query: {
        user: authUserObjectId,
        status: {
          $in: [ParticipantStatus.INVITED, ParticipantStatus.CONNECTED],
        },
      },
    });

    const connectedParticipants = myParticipants.filter(
      (p) => p.status === ParticipantStatus.CONNECTED,
    );
    const invitedParticipants = myParticipants.filter(
      (p) => p.status === ParticipantStatus.INVITED,
    );

    let activeCallData: any = null;

    for (const cp of connectedParticipants) {
      const call = await this.callsRepository.findOne({
        query: {
          _id: cp.call,
          status: { $in: BUSY_CALL_STATUSES },
        },
      });

      if (call) {
        const participants = await this.participantsRepository.findMany({
          query: { call: call._id },
        });
        const myUpdatedParticipant = participants.find(
          (p: any) => p.user?._id?.toString() === authUserId,
        );

        activeCallData = {
          call: this.callsRepository.toCallResponse(call),
          participant: myUpdatedParticipant
            ? this.callsRepository.toParticipantResponse(myUpdatedParticipant)
            : undefined,
          participants: participants.map((p) =>
            this.callsRepository.toParticipantResponse(p),
          ),
        };
        break;
      } else {
        await this.participantsRepository.updateOne({
          query: { _id: cp._id },
          dto: {
            status: ParticipantStatus.LEFT,
            leftAt: new Date(),
          },
        });
        console.log('Cleaned up orphan participant:', cp._id.toString());
      }
    }

    if (!activeCallData) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const directCall = await this.callsRepository.findOne({
        query: {
          $or: [
            { caller: authUserObjectId },
            { receiver: authUserObjectId },
            { createdBy: authUserObjectId },
          ],
          status: { $in: BUSY_CALL_STATUSES },
          createdAt: { $gte: fiveMinutesAgo },
        },
        sort: { createdAt: -1 },
      });

      if (directCall) {
        const participants = await this.participantsRepository.findMany({
          query: { call: directCall._id },
        });
        const myParticipant = participants.find(
          (p: any) => p.user?._id?.toString() === authUserId,
        );

        activeCallData = {
          call: this.callsRepository.toCallResponse(directCall),
          participant: myParticipant
            ? this.callsRepository.toParticipantResponse(myParticipant)
            : undefined,
          participants: participants.map((p) =>
            this.callsRepository.toParticipantResponse(p),
          ),
        };
      }
    }

    const incomingCalls: any[] = [];
    for (const invited of invitedParticipants) {
      const call = await this.callsRepository.findOne({
        query: {
          _id: invited.call,
          status: { $in: [CallStatus.INITIATED, CallStatus.RINGING] },
        },
      });
      if (call) {
        incomingCalls.push(this.callsRepository.toCallResponse(call));
      } else {
        await this.participantsRepository.updateOne({
          query: { _id: invited._id },
          dto: { status: ParticipantStatus.LEFT, leftAt: new Date() },
        });
      }
    }

    return {
      call: activeCallData?.call ?? null,
      participant: activeCallData?.participant,
      participants: activeCallData?.participants,
      incomingCalls,
    };
  }
}
