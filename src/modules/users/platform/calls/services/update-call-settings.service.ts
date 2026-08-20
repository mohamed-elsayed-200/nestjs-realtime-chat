import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import {
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../../common/types/enums';

@Injectable()
export class UpdateCallService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

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
