import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import {
  ActivationStatus,
  SpaceMemberPermission,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  public async createChannel({ dto, authUser }) {
    const newSpace = {
      name: dto?.name,
      avatar: dto?.avatar,
      profileColor: this.usersRepository.getRandomColor(),
      bio: dto?.bio,
      archive: false,
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.CHANNEL,
      createdBy: new Types.ObjectId(authUser._id),
      membersCount: 1,
      settings: dto?.settings,
    };

    const space = await this.spacesRepository.createOne({ dto: newSpace });
    if (!space) throw new InternalServerErrorException('spaces.notCreated');

    await this.membersRepository.createOne({
      dto: {
        user: new Types.ObjectId(authUser._id),
        space: new Types.ObjectId(space._id?.toString()),
        role: SpaceMemberRole.OWNER,
        joinedAt: new Date(),
        pin: false,
        mute: false,
        archive: false,
      },
    });

    return space;
  }

  public async changeChannelInfo({ spaceId, dto, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser?._id);

    const member = await this.membersRepository.findOne({
      query: {
        user: userObjectId,
        space: spaceObjectId,
      },
    });

    if (!member) throw new NotFoundException('members.notFoundOne');

    const canUpdate =
      member.role === SpaceMemberRole.OWNER ||
      member.role === SpaceMemberRole.ADMIN ||
      member.permissions?.includes(SpaceMemberPermission.CHANGE_SPACE_INFO);

    if (!canUpdate) throw new InternalServerErrorException('spaces.notUpdated');

    const space = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId, type: SpaceTypes.CHANNEL },
      dto,
    });

    if (!space) throw new InternalServerErrorException('spaces.notUpdated');

    return space;
  }
}
