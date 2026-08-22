import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';
import { ParticipantsRepository } from '../../../../../common/modules/platform/calls/participants.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import {
  BUSY_CALL_STATUSES,
  CallScope,
  CallStatus,
  CallType,
  ParticipantStatus,
} from '../../../../../common/types/enums';
import { JoinCallService } from './join-call.service';

@Injectable()
export class StartCallService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
    private readonly membersRepository: MembersRepository,
    private readonly joinCallService: JoinCallService,
  ) {}

  public async start({ dto, authUser }) {
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
        return this.joinCallService.join({
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
      call: this.callsRepository.toCallResponse(call),
      participant:
        this.callsRepository.toParticipantResponse(callerParticipant),
    };
  }
}
