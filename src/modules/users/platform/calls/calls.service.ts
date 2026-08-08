import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CallParticipantRole,
  CallScope,
  CallStatus,
  CallType,
  ParticipantStatus,
} from '../../../../common/types/enums';
import { CallsRepository } from '../../../../common/modules/platform/calls/calls.repository';
import { ParticipantsRepository } from '../../../../common/modules/platform/calls/participants.repository';
import { Types } from 'mongoose';

function toPersonInfo(user: any) {
  if (!user) return undefined;
  return {
    id: user._id?.toString() ?? user.id,
    name: user.name,
    avatar: user.avatar,
    profileColor: user.profileColor,
    bio: user.bio,
  };
}

function toSpaceInfo(space: any) {
  if (!space) return undefined;
  return {
    id: space._id?.toString() ?? space.id,
    name: space.name,
    avatar: space.avatar,
    profileColor: space.profileColor,
    type: space.type,
  };
}

function toCallResponse(call: any) {
  if (!call) return call;

  return {
    ...call,
    id: call._id?.toString() ?? call.id,
    caller: call.caller?._id?.toString() ?? call.caller?.toString(),
    receiver: call.receiver?._id?.toString() ?? call.receiver?.toString(),
    space: call.space?._id?.toString() ?? call.space?.toString(),
    callerUser: toPersonInfo(call.caller),
    receiverUser: toPersonInfo(call.receiver),
    spaceInfo: toSpaceInfo(call.space),
  };
}

function toParticipantResponse(participant: any) {
  if (!participant) return participant;

  return {
    ...participant,
    id: participant._id?.toString() ?? participant.id,
    user: participant.user?._id?.toString() ?? participant.user?.toString(),
    call: participant.call?.toString(),
    space: participant.space?.toString(),
    userInfo: toPersonInfo(participant.user),
  };
}

@Injectable()
export class CallsService {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
  ) {}

  public async startCall({ dto, authUser }) {
    const {
      receiver,
      space,
      scope = CallScope.PRIVATE,
      type = CallType.AUDIO,
      isConference = false,
      maxParticipants = 2,
      isBroadcast = false,
      participantIds = [],
      metadata,
      tags,
    } = dto;

    if (scope === CallScope.PRIVATE && !receiver) {
      throw new BadRequestException('receiver is required for private calls');
    }

    const isPrivate = scope === CallScope.PRIVATE;

    const call = await this.callsRepository.createOne({
      dto: {
        caller: authUser._id,
        receiver: isPrivate ? receiver : undefined,
        space,
        createdBy: authUser._id,
        scope,
        type,
        status: isPrivate ? CallStatus.RINGING : CallStatus.IN_PROGRESS,
        isConference: isPrivate ? false : true || isConference,
        maxParticipants,
        isBroadcast,
        metadata,
        tags,
        startedAt: isPrivate ? undefined : new Date(),
        participantsCount: 1,
        maxConcurrentParticipants: 1,
      },
    });

    await this.participantsRepository.createOne({
      dto: {
        user: authUser._id,
        member: authUser.memberId ?? authUser._id,
        call: call._id,
        space,
        status: ParticipantStatus.CONNECTED,
        callRole: CallParticipantRole.HOST,
        joinedAt: new Date(),
      },
    });

    if (isPrivate) {
      await this.participantsRepository.createOne({
        dto: {
          user: receiver,
          member: dto.receiverMemberId ?? receiver,
          call: call._id,
          space,
          status: ParticipantStatus.INVITED,
          callRole: CallParticipantRole.LISTENER,
          invitedAt: new Date(),
        },
      });
    } else if (participantIds.length) {
      await Promise.all(
        participantIds.map((id: string) =>
          this.participantsRepository.createOne({
            dto: {
              user: id,
              member: id,
              call: call._id,
              space,
              status: ParticipantStatus.INVITED,
              callRole: CallParticipantRole.LISTENER,
              invitedAt: new Date(),
            },
          }),
        ),
      );
    }

    return toCallResponse(call);
  }

  public async acceptCall({ dto, authUser }) {
    const callObjectId = new Types.ObjectId(dto.callId);
    const authUserObjectId = new Types.ObjectId(authUser._id);

    const call = await this.callsRepository.findOne({
      query: { _id: callObjectId },
    });
    if (!call) throw new NotFoundException('Call not found');

    if (![CallStatus.INITIATED, CallStatus.RINGING].includes(call.status)) {
      throw new BadRequestException('Call can no longer be accepted');
    }

    const participant = await this.participantsRepository.findOne({
      query: { call: callObjectId, user: authUserObjectId },
    });
    if (!participant) {
      throw new ForbiddenException('You are not invited to this call');
    }

    await this.participantsRepository.updateOne({
      query: { _id: participant._id },
      dto: {
        status: ParticipantStatus.CONNECTED,
        joinedAt: new Date(),
      },
    });

    const updatedCall = await this.callsRepository.updateOne({
      query: { _id: callObjectId },
      dto: {
        status: CallStatus.IN_PROGRESS,
        startedAt: call.startedAt ?? new Date(),
        $inc: { participantsCount: 1, maxConcurrentParticipants: 1 },
      },
    });

    return toCallResponse(updatedCall);
  }

  public async rejectCall({ dto, authUser }) {
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
      throw new ForbiddenException('You are not invited to this call');
    }

    await this.participantsRepository.updateOne({
      query: { _id: participant._id },
      dto: { status: ParticipantStatus.REJECTED },
    });

    if (call.scope === CallScope.PRIVATE) {
      const updatedCall = await this.callsRepository.updateOne({
        query: { _id: callObjectId },
        dto: {
          status: CallStatus.REJECTED,
          endedAt: new Date(),
          endedBy: authUserObjectId,
        },
      });
      return toCallResponse(updatedCall);
    }

    return toCallResponse(call);
  }

  public async joinCall({ dto, authUser }) {
    const callObjectId = new Types.ObjectId(dto.callId);
    const authUserObjectId = new Types.ObjectId(authUser._id);

    const call = await this.callsRepository.findOne({
      query: { _id: callObjectId },
    });
    if (!call) throw new NotFoundException('Call not found');

    if ([CallStatus.COMPLETED, CallStatus.FAILED].includes(call.status)) {
      throw new BadRequestException('Call has already ended');
    }

    if (
      call.maxParticipants &&
      call.participantsCount >= call.maxParticipants
    ) {
      throw new BadRequestException('Call has reached max participants');
    }

    let participant = await this.participantsRepository.findOne({
      query: { call: callObjectId, user: authUserObjectId },
    });

    if (participant) {
      participant = await this.participantsRepository.updateOne({
        query: { _id: participant._id },
        dto: {
          status: ParticipantStatus.CONNECTED,
          joinedAt: new Date(),
          leftAt: null,
        },
      });
    } else {
      participant = await this.participantsRepository.createOne({
        dto: {
          user: authUserObjectId,
          // member: authUser.memberId ?? authUserObjectId,
          call: callObjectId,
          space: call.space,
          status: ParticipantStatus.CONNECTED,
          callRole: CallParticipantRole.LISTENER,
          joinedAt: new Date(),
        },
      });
    }

    const updatedCall = await this.callsRepository.updateOne({
      query: { _id: callObjectId },
      dto: {
        status: CallStatus.IN_PROGRESS,
        startedAt: call.startedAt ?? new Date(),
        $inc: { participantsCount: 1, maxConcurrentParticipants: 1 },
      },
    });

    return {
      call: toCallResponse(updatedCall),
      participant: toParticipantResponse(participant),
    };
  }

  public async leaveCall({ dto, authUser }) {
    const { callId } = dto;

    const call = await this.callsRepository.findOne({
      query: { _id: callId },
    });
    if (!call) throw new NotFoundException('Call not found');

    const participant = await this.participantsRepository.findOne({
      query: { call: callId, user: authUser._id },
    });
    if (!participant) {
      throw new NotFoundException('You are not part of this call');
    }

    await this.participantsRepository.updateOne({
      query: { _id: participant._id },
      dto: {
        status: ParticipantStatus.LEFT,
        leftAt: new Date(),
      },
    });

    const remaining = await this.participantsRepository.findOne({
      query: {
        call: callId,
        status: ParticipantStatus.CONNECTED,
      },
    });

    if (!remaining) {
      return this.endCall({ dto: { callId }, authUser });
    }

    const updatedCall = await this.callsRepository.updateOne({
      query: { _id: callId },
      dto: { $inc: { participantsCount: -1 } },
    });

    return toCallResponse(updatedCall);
  }

  public async endCall({ dto, authUser }) {
    const { callId } = dto;

    const call = await this.callsRepository.findOne({
      query: { _id: callId },
    });
    if (!call) throw new NotFoundException('Call not found');

    if ([CallStatus.COMPLETED, CallStatus.FAILED].includes(call.status)) {
      return toCallResponse(call);
    }

    const endedAt = new Date();
    const startedAt = call.startedAt ? new Date(call.startedAt) : endedAt;
    const duration = Math.max(
      0,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
    );

    const updatedCall = await this.callsRepository.updateOne({
      query: { _id: callId },
      dto: {
        status: CallStatus.COMPLETED,
        endedAt,
        endedBy: authUser._id,
        duration,
      },
    });

    await this.participantsRepository.updateOne({
      query: {
        call: callId,
        status: ParticipantStatus.CONNECTED,
      },
      dto: {
        status: ParticipantStatus.LEFT,
        leftAt: endedAt,
      },
    });

    return toCallResponse(updatedCall);
  }
}
