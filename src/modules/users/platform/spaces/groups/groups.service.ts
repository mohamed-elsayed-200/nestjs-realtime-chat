import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import {
  ActivationStatus,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';

@Injectable()
export class GroupsService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  public async createGroup({ dto, authUser }) {
    const members = [
      ...dto.members?.filter((id) => id !== authUser._id.toString()),
      authUser._id.toString(),
    ];

    const newSpace = {
      name: dto?.name,
      settings: dto?.settings,
      avatar: dto?.avatar,
      profileColor: this.usersRepository.getRandomColor(),
      bio: dto?.bio,
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.GROUP,
      createdBy: new Types.ObjectId(authUser._id),
      membersCount: members?.length,
    };

    const space = await this.spacesRepository.createOne({ dto: newSpace });
    if (!space) throw new InternalServerErrorException('spaces.notCreated');

    await Promise.all(
      members.map((id) =>
        this.membersRepository.createOne({
          dto: {
            user: new Types.ObjectId(id),
            space: new Types.ObjectId(space._id?.toString()),
            role:
              authUser._id.toString() === id
                ? SpaceMemberRole.OWNER
                : SpaceMemberRole.MEMBER,
            joinedAt: new Date(),
            isPined: false,
            isMuted: false,
            isArchived: false,
          },
        }),
      ),
    );

    return space;
  }
}
