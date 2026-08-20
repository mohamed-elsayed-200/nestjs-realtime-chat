import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import {
  memberPermissionList,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class LeaveFromSpaceService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async leave({ spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFound');

    const member = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    if (!member) throw new NotFoundException('members.notFound');

    if (member.isDeleted) throw new NotFoundException('members.notFound');

    if (member.role === SpaceMemberRole.OWNER)
      throw new BadRequestException('members.ownerCannotLeave');

    await this.membersRepository.updateOne({
      query: { space: spaceObjectId, user: userObjectId },
      dto: {
        isDeleted: true,
        deletedAt: new Date(),
        joinedAt: null,
        role: null,
        adminTag: null,
        adminTagColor: null,
        permission: member?.permissions?.filter((perm) =>
          memberPermissionList?.includes(perm),
        ),
      },
    });

    const updatedSpace = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { $inc: { membersCount: -1 } },
    });

    if (findSpace.type === SpaceTypes.COMMUNITY) {
      const subSpaces = await this.spacesRepository.findLean({
        query: { parentSpace: spaceObjectId },
      });

      await Promise.all(
        subSpaces.map(async (subSpace: any) => {
          const subMember = await this.membersRepository.findOne({
            query: { space: subSpace._id, user: userObjectId },
          });

          if (
            !subMember ||
            subMember.isDeleted ||
            subMember.role === SpaceMemberRole.OWNER
          )
            return;

          await this.membersRepository.updateOne({
            query: { _id: subMember._id },
            dto: {
              isDeleted: true,
              deletedAt: new Date(),
              joinedAt: null,
              role: null,
              adminTag: null,
              adminTagColor: null,
              permission: subMember?.permissions?.filter((perm: string) =>
                memberPermissionList?.includes(perm),
              ),
            },
          });

          await this.spacesRepository.updateOne({
            query: { _id: subSpace._id },
            dto: { $inc: { membersCount: -1 } },
          });
        }),
      );
    }

    return {
      ...updatedSpace.toObject(),
      role: member?.role,
      unreadCount: member?.unreadCount,
      isPined: member?.isPined,
      isMuted: member?.isMuted,
      isArchived: member?.isArchived,
      permissions: member?.permissions,
      id: updatedSpace?._id?.toString(),
      _id: undefined,
      lastMessage: {
        ...findSpace?.lastMessage,
        id: findSpace?.lastMessage?._id?.toString(),
        _id: undefined,
        sender: {
          name: authUser?.name,
          id: authUser?._id,
          username: authUser?.username,
          avatar: authUser?.avatar,
          profileColor: authUser?.profileColor,
        },
      },
    };
  }
}
