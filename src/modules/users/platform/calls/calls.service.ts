import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CallParticipantRole,
  CallScope,
  CallStatus,
  CallType,
  MessageStatus,
  MessageType,
  ParticipantStatus,
} from '../../../../common/types/enums';
import { CallsRepository } from '../../../../common/modules/platform/calls/calls.repository';
import { ParticipantsRepository } from '../../../../common/modules/platform/calls/participants.repository';
import { Types } from 'mongoose';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { buildCallSystemMessageText } from '../../../../common/utils/call-message-text';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';

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
    id: call?._id?.toString() ?? call?.id,
    caller: call?.caller?._id?.toString() ?? call?.caller?.toString(),
    receiver: call?.receiver?._id?.toString() ?? call?.receiver?.toString(),
    space: call?.space?._id?.toString() ?? call?.space?.toString(),
    callerUser: toPersonInfo(call?.caller),
    receiverUser: toPersonInfo(call?.receiver),
    spaceInfo: toSpaceInfo(call?.space),
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
const BUSY_CALL_STATUSES = [
  CallStatus.INITIATED,
  CallStatus.RINGING,
  CallStatus.IN_PROGRESS,
];
@Injectable()
export class CallsService {
  constructor(
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async getCallById({ callId, authUser }) {
    const call = await this.callsRepository.findOne({
      query: { _id: new Types.ObjectId(callId) },
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
      call: toCallResponse(call),
      participants: participants.map(toParticipantResponse),
    };
  }

  public async getActiveCallForUser({ authUser }) {
    const authUserObjectId = new Types.ObjectId(authUser._id);

    // 1) Find ALL my participants (both connected and invited)
    const myParticipants = await this.participantsRepository.findMany({
      query: {
        user: authUserObjectId,
        status: {
          $in: [ParticipantStatus.INVITED, ParticipantStatus.CONNECTED],
        },
      },
    });

    if (!myParticipants.length) {
      return { call: null, incomingCalls: [] };
    }

    const connectedParticipant = myParticipants.find(
      (p) => p.status === ParticipantStatus.CONNECTED,
    );
    const invitedParticipants = myParticipants.filter(
      (p) => p.status === ParticipantStatus.INVITED,
    );

    // 2) Active call (CONNECTED)
    let activeCallData: any = null;
    if (connectedParticipant) {
      const call = await this.callsRepository.findOne({
        query: {
          _id: connectedParticipant.call,
          status: {
            $in: [
              CallStatus.INITIATED,
              CallStatus.RINGING,
              CallStatus.IN_PROGRESS,
            ],
          },
        },
      });

      if (call) {
        const participants = await this.participantsRepository.findMany({
          query: { call: call._id },
        });
        const myUpdatedParticipant = participants.find(
          (p: any) => p.user?.toString() === authUser._id.toString(),
        );

        activeCallData = {
          call: toCallResponse(call),
          participant: myUpdatedParticipant
            ? toParticipantResponse(myUpdatedParticipant)
            : undefined,
          participants: participants.map(toParticipantResponse),
        };
      }
    }

    // 3) Incoming calls (INVITED) — ALL of them
    const incomingCalls: any[] = [];
    for (const invited of invitedParticipants) {
      const call = await this.callsRepository.findOne({
        query: {
          _id: invited.call,
          status: { $in: [CallStatus.INITIATED, CallStatus.RINGING] },
        },
      });
      if (call) {
        incomingCalls.push(toCallResponse(call));
      }
    }

    return {
      call: activeCallData?.call ?? null,
      participant: activeCallData?.participant,
      participants: activeCallData?.participants,
      incomingCalls,
    };
  }

  public async startCall({ dto, authUser }) {
    const authUserObjectId = new Types.ObjectId(authUser._id);
    const spaceObjectId = new Types.ObjectId(dto?.space);
    const {
      receiver,
      type = CallType.AUDIO,
      isBroadcast = false,
      participantIds = [],
      metadata,
      tags,
    } = dto;

    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!findSpace) throw new BadRequestException('space not found');

    const scope = findSpace.type as any;
    const isPrivate = scope === CallScope.PRIVATE;

    if (isPrivate && !receiver) {
      throw new BadRequestException('receiver is required for private calls');
    }

    if (!isPrivate) {
      const existingCall = await this.callsRepository.findOne({
        query: {
          space: spaceObjectId,
          status: { $in: BUSY_CALL_STATUSES },
        },
      });

      if (existingCall) {
        return this.joinCall({
          dto: { callId: existingCall._id.toString() },
          authUser,
        });
      }
    }

    const callerMember = await this.membersRepository.findOne({
      query: { user: authUserObjectId, space: spaceObjectId },
    });
    if (!callerMember) {
      throw new NotFoundException('You are not a member of this space');
    }

    const callerBusyParticipant = await this.participantsRepository.findOne({
      query: {
        user: authUserObjectId,
        status: ParticipantStatus.CONNECTED,
      },
    });
    if (callerBusyParticipant) {
      const busyCall = await this.callsRepository.findOne({
        query: {
          _id: callerBusyParticipant.call,
          status: { $in: BUSY_CALL_STATUSES },
        },
      });
      if (busyCall) {
        throw new ConflictException('You are already in another call');
      }
    }

    const callerBusyCall = await this.callsRepository.findOne({
      query: {
        $or: [{ caller: authUserObjectId }, { receiver: authUserObjectId }],
        status: { $in: BUSY_CALL_STATUSES },
      },
    });
    if (callerBusyCall) {
      throw new ConflictException('You are already in another call');
    }

    let receiverMember: any = null;
    if (isPrivate) {
      const receiverObjectId = new Types.ObjectId(receiver);

      const receiverBusyCall = await this.callsRepository.findOne({
        query: {
          $or: [{ caller: receiver }, { receiver }],
          status: { $in: BUSY_CALL_STATUSES },
        },
      });
      if (receiverBusyCall) {
        throw new ConflictException('User is currently on another call');
      }

      receiverMember = await this.membersRepository.findOne({
        query: { user: receiverObjectId, space: spaceObjectId },
      });
      if (!receiverMember) {
        throw new BadRequestException('Receiver is not a member of this space');
      }
    }

    const call = await this.callsRepository.createOne({
      dto: {
        caller: authUserObjectId,
        receiver: isPrivate ? receiver : undefined,
        space: spaceObjectId,
        createdBy: authUserObjectId,
        scope,
        type,
        status: isPrivate ? CallStatus.RINGING : CallStatus.IN_PROGRESS,
        isConference: !isPrivate,
        isBroadcast,
        metadata,
        tags,
        startedAt: isPrivate ? undefined : new Date(),
        maxParticipants: isPrivate ? 2 : 100,
        participantsCount: 1,
        maxConcurrentParticipants: 1,
      },
    });

    const callerParticipant = await this.participantsRepository.createOne({
      dto: {
        user: authUserObjectId,
        member: callerMember._id,
        call: call?._id,
        space: spaceObjectId,
        status: ParticipantStatus.CONNECTED,
        callRole: isPrivate ? 'listener' : 'host',
        joinedAt: new Date(),
      },
    });

    if (isPrivate) {
      await this.participantsRepository.createOne({
        dto: {
          user: receiver,
          member: receiverMember._id,
          call: call?._id,
          space: spaceObjectId,
          status: ParticipantStatus.INVITED,
          callRole: 'listener',
          invitedAt: new Date(),
        },
      });
    } else if (participantIds.length) {
      const filteredIds = participantIds.filter(
        (id: string) => id !== authUser._id.toString(),
      );

      const busyIds: string[] = [];
      for (const id of filteredIds) {
        const busy = await this.callsRepository.findOne({
          query: {
            $or: [{ caller: id }, { receiver: id }],
            status: { $in: BUSY_CALL_STATUSES },
          },
        });
        if (busy) busyIds.push(id);
      }

      const availableIds = filteredIds.filter(
        (id: string) => !busyIds.includes(id),
      );

      if (availableIds.length) {
        const memberDocs = await this.membersRepository.findMany({
          query: {
            space: spaceObjectId,
            user: {
              $in: availableIds.map((id: string) => new Types.ObjectId(id)),
            },
          },
        });
        const memberByUserId = new Map(
          memberDocs.map((m: any) => [m.user.toString(), m._id]),
        );

        const validIds = availableIds.filter((id: string) =>
          memberByUserId.has(id),
        );

        await Promise.all(
          validIds.map((id: string) =>
            this.participantsRepository.createOne({
              dto: {
                user: id,
                member: memberByUserId.get(id),
                call: call?._id,
                space: spaceObjectId,
                status: ParticipantStatus.INVITED,
                callRole: 'listener',
                invitedAt: new Date(),
              },
            }),
          ),
        );
      }
    }

    return {
      call: toCallResponse(call),
      participant: toParticipantResponse(callerParticipant),
    };
  }

  public async acceptCall({ dto, authUser }) {
    const callObjectId = new Types.ObjectId(dto.callId);
    const authUserObjectId = new Types.ObjectId(authUser._id);

    const call = await this.callsRepository.findOne({
      query: { _id: callObjectId },
    });
    if (!call) throw new NotFoundException('Call not found');

    if (![CallStatus.INITIATED, CallStatus.RINGING].includes(call?.status)) {
      throw new BadRequestException('Call can no longer be accepted');
    }

    const participant = await this.participantsRepository.findOne({
      query: { call: callObjectId, user: authUserObjectId },
    });
    if (!participant) {
      throw new NotFoundException('You are not invited to this call');
    }

    const updatedParticipant = await this.participantsRepository.updateOne({
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
        startedAt: call?.startedAt ?? new Date(),
        $inc: { participantsCount: 1, maxConcurrentParticipants: 1 },
      },
    });

    return {
      call: toCallResponse(updatedCall),
      participant: toParticipantResponse(updatedParticipant),
    };
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
        call: toCallResponse(updatedCall),
        systemMessage: {
          ...systemMessage.toObject(),
          id: systemMessage._id.toString(),
          _id: undefined,
        },
      };
    }

    return { call: toCallResponse(call) };
  }

  public async joinCall({ dto, authUser }) {
    if (!dto?.callId) {
      throw new BadRequestException('callId is required');
    }

    let callObjectId: Types.ObjectId;
    let authUserObjectId: Types.ObjectId;

    try {
      callObjectId = new Types.ObjectId(dto.callId);
      authUserObjectId = new Types.ObjectId(authUser._id);
    } catch (error) {
      throw new BadRequestException('Invalid ID format');
    }

    const call = await this.callsRepository.findOne({
      query: { _id: callObjectId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.scope === CallScope.PRIVATE) {
      throw new BadRequestException(
        'Use acceptCall for private calls, not joinCall',
      );
    }

    if ([CallStatus.COMPLETED, CallStatus.FAILED].includes(call?.status)) {
      throw new BadRequestException('Call has already ended');
    }

    if (
      call?.maxParticipants &&
      call?.participantsCount >= call?.maxParticipants
    ) {
      throw new BadRequestException('Call has reached max participants');
    }

    let participant = await this.participantsRepository.findOne({
      query: {
        call: callObjectId,
        user: authUserObjectId,
      },
    });

    let shouldIncrementCount = false;

    if (participant) {
      const wasNotConnected =
        participant.status !== ParticipantStatus.CONNECTED;

      participant = await this.participantsRepository.updateOne({
        query: { _id: participant._id },
        dto: {
          status: ParticipantStatus.CONNECTED,
          joinedAt: new Date(),
          leftAt: null,
        },
      });

      shouldIncrementCount = wasNotConnected;
    } else {
      const findMember = await this.membersRepository.findOne({
        query: {
          user: authUserObjectId,
          space: call?.space?._id,
        },
      });

      if (!findMember) {
        throw new NotFoundException('You are not a member of this space');
      }

      participant = await this.participantsRepository.createOne({
        dto: {
          user: authUserObjectId,
          member: findMember._id,
          call: callObjectId,
          space: call?.space?._id,
          status: ParticipantStatus.CONNECTED,
          callRole: 'listener',
          joinedAt: new Date(),
        },
      });

      shouldIncrementCount = true;
    }

    const updateDto: any = {
      status: CallStatus.IN_PROGRESS,
      startedAt: call?.startedAt ?? new Date(),
    };

    if (shouldIncrementCount) {
      updateDto.$inc = {
        participantsCount: 1,
        maxConcurrentParticipants: 1,
      };
    }

    const updatedCall = await this.callsRepository.updateOne({
      query: { _id: callObjectId },
      dto: updateDto,
    });

    return {
      call: toCallResponse(updatedCall),
      participant: toParticipantResponse(participant),
    };
  }

  public async leaveCall({ dto, authUser }) {
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
      const endResult = await this.endCall({
        dto: { callId: callObjectId },
        authUser,
      });

      return {
        call: endResult.call,
        participant: toParticipantResponse(updatedParticipant),
        participants: endResult.participants,
        systemMessage: endResult.systemMessage,
      };
    }

    const updatedCall = await this.callsRepository.updateOne({
      query: { _id: callObjectId },
      dto: { $inc: { participantsCount: -1 } },
    });

    return {
      call: toCallResponse(updatedCall),
      participant: toParticipantResponse(updatedParticipant),
      participants: undefined,
      systemMessage: undefined,
    };
  }

  public async endCall({ dto, authUser }) {
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
      return { call: toCallResponse(call) };
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
      call: toCallResponse(updatedCall),
      participants: affectedParticipants.map(toParticipantResponse),
      systemMessage: {
        ...systemMessage.toObject(),
        id: systemMessage._id.toString(),
        _id: undefined,
      },
    };
  }
}
