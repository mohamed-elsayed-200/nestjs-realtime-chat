import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CallsRepository } from '../../../../../common/modules/platform/calls/calls.repository';
import { ParticipantsRepository } from '../../../../../common/modules/platform/calls/participants.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import {
  CallScope,
  CallStatus,
  ParticipantStatus,
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../../common/types/enums';

@Injectable()
export class JoinCallService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly callsRepository: CallsRepository,
    private readonly participantsRepository: ParticipantsRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

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

    const findMember = await this.membersRepository.findOne({
      query: {
        user: authUserObjectId,
        space: call?.space?._id,
      },
    });

    if (!findMember) {
      throw new NotFoundException('You are not a member of this space');
    }

    const isOwner = findMember.role === SpaceMemberRole.OWNER;
    const isAdmin =
      findMember.role === SpaceMemberRole.ADMIN &&
      findMember.permissions.includes(
        SpaceMemberPermission.MANAGE_LIVE_STREAMS,
      );
    const isAdminOrOwner = isOwner || isAdmin;

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
      call: this.callsRepository.toCallResponse(updatedCall),
      participant: this.callsRepository.toParticipantResponse(participant),
    };
  }
}
