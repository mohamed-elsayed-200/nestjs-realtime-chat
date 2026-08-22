import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  adminPermissionList,
  SpaceMemberRole,
} from '../../../../../common/types/enums';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';

@Injectable()
export class TransferOwnershipService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly spacesRepository: SpacesRepository,
  ) {}

  public async transfer({ dto, authUser }) {
    const { member, space } = dto;
    const spaceObjectId = new Types.ObjectId(space);
    const userObjectId = new Types.ObjectId(authUser._id);
    const memberObjectId = new Types.ObjectId(member);

    const authMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });

    if (!authMember) throw new NotFoundException('members.noPermission');
    if (authMember.role !== SpaceMemberRole.OWNER)
      throw new BadRequestException('members.noPermission');

    const targetMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      populate: [
        {
          path: 'user',
          model: 'User',
          select: 'name profileColor avatar username',
        },
      ],
    });

    if (!targetMember) throw new NotFoundException('members.notFound');
    if (targetMember.role === SpaceMemberRole.OWNER)
      throw new BadRequestException('members.alreadyOwner');

    const demoted = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: authMember._id },
      dto: {
        role: SpaceMemberRole.MEMBER,
        permissions: [],
        adminTag: null,
        adminTagColor: null,
      },
    });

    if (!demoted) throw new InternalServerErrorException('members.notUpdated');

    const promoted = await this.membersRepository.updateOne({
      query: { space: spaceObjectId, _id: memberObjectId },
      dto: {
        role: SpaceMemberRole.OWNER,
        permissions: adminPermissionList,
        adminTag: 'Owner',
        adminTagColor: '#22c55e',
      },
    });

    await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: {
        createdBy: new Types.ObjectId(promoted?.user?.toString()),
      },
    });

    if (!promoted) throw new InternalServerErrorException('members.notUpdated');

    return {
      spaceId: spaceObjectId?.toString(),
      transferredFrom: demoted,
      transferredTo: promoted,
      spaceCreatedBy: targetMember.user,
    };
  }
}
