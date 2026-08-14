import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CallScope,
  CallStatus,
  CallType,
  MessageStatus,
  MessageType,
  ParticipantStatus,
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../common/types/enums';
import { CallsRepository } from '../../../../common/modules/platform/calls/calls.repository';
import { ParticipantsRepository } from '../../../../common/modules/platform/calls/participants.repository';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { buildCallSystemMessageText } from '../../../../common/utils/call-message-text';
import { MembersRepository } from '../../../../common/modules/platform/members/members.repository';
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
    settings: space.settings?.call,
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
    memberRole: participant.member?.role,
    memberPermissions: participant.member?.permissions,
    adminTag: participant.member?.adminTag,
    adminTagColor: participant.member?.adminTagColor,
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
          call: toCallResponse(call),
          participant: myUpdatedParticipant
            ? toParticipantResponse(myUpdatedParticipant)
            : undefined,
          participants: participants.map(toParticipantResponse),
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
          call: toCallResponse(directCall),
          participant: myParticipant
            ? toParticipantResponse(myParticipant)
            : undefined,
          participants: participants.map(toParticipantResponse),
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
        incomingCalls.push(toCallResponse(call));
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

  public async getCallSettings({ spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const authUserObjectId = new Types.ObjectId(authUser._id);

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!space) throw new NotFoundException('Space not found');

    const member = await this.membersRepository.findOne({
      query: { user: authUserObjectId, space: spaceObjectId },
    });
    if (!member) {
      throw new BadRequestException('You are not a member of this space');
    }

    const settings = space.settings?.call ?? {};

    return {
      spaceId: space._id.toString(),
      settings,
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

    // ← 1. Get member FIRST (before password check)
    const findMember = await this.membersRepository.findOne({
      query: {
        user: authUserObjectId,
        space: call?.space?._id,
      },
    });

    if (!findMember) {
      throw new NotFoundException('You are not a member of this space');
    }

    // ← 2. Check if owner or admin
    const isOwner = findMember.role === SpaceMemberRole.OWNER;
    const isAdmin =
      findMember.role === SpaceMemberRole.ADMIN &&
      findMember.permissions.includes(
        SpaceMemberPermission.MANAGE_LIVE_STREAMS,
      );
    const isAdminOrOwner = isOwner || isAdmin;

    // ← 3. Password check (skip for owners/admins)
    const findSpace = await this.spacesRepository.findOne({
      query: { _id: call.space },
    });
    const callPassword = findSpace?.settings?.call?.password;
    const isPasswordProtected = Boolean(
      callPassword && callPassword.length > 0,
    );

    if (isPasswordProtected && !isAdminOrOwner) {
      if (!dto.password || dto.password !== callPassword) {
        throw new BadRequestException('Invalid password');
      }
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
      // ← 4. Re-use findMember (no need to fetch again)
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

  public async toggleParticipantMute({ dto, authUser }) {
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
      call: toCallResponse(call),
      participant: toParticipantResponse(updatedParticipant),
      targetUserId: targetUserObjectId.toString(),
      isMuted: updatedParticipant.isMuted,
    };
  }

  public async toggleRaiseHand({ dto, authUser }) {
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
      call: toCallResponse(call),
      participant: toParticipantResponse(updatedParticipant),
    };
  }

  public async updateCallSettings({ dto, authUser }) {
    const { spaceId, settings, callId } = dto;
    const spaceObjectId = new Types.ObjectId(spaceId);
    const authUserObjectId = new Types.ObjectId(authUser._id);

    const space = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!space) throw new NotFoundException('Space not found');

    const member = await this.membersRepository.findOne({
      query: { user: authUserObjectId, space: spaceObjectId },
    });
    if (!member) {
      throw new BadRequestException('You are not a member of this space');
    }

    const canChangeSettings =
      member.role === SpaceMemberRole.OWNER ||
      (member.role === SpaceMemberRole.ADMIN &&
        member.permissions?.includes(SpaceMemberPermission.CHANGE_SETTINGS));

    if (!canChangeSettings) {
      throw new BadRequestException(
        'Only admins or owners can update call settings',
      );
    }

    const currentSettings = space.settings ?? {};
    const currentCallSettings = currentSettings.call ?? {};

    const mergedSettings = { ...currentCallSettings, ...settings };

    await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: {
        settings: {
          ...currentSettings,
          call: mergedSettings,
        },
      },
    });

    return {
      spaceId,
      callId,
      settings: mergedSettings,
    };
  }
}
