import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import {
  JoinApproval,
  memberPermissionList,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';

@Injectable()
export class JoinToSpaceService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  public async join({ spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    const findSpace: any = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId },
      populate: [
        {
          path: 'lastMessage',
          model: 'Message',
        },
      ],
    });

    if (!findSpace) throw new NotFoundException('spaces.notFound');
    const isChannel = findSpace?.type === SpaceTypes.CHANNEL;
    const isGroup = findSpace?.type === SpaceTypes.GROUP;
    const isPrivate = findSpace?.type === SpaceTypes.PRIVATE;
    const isBot = findSpace?.type === SpaceTypes.BOT;
    if (isPrivate || isBot)
      throw new BadRequestException('spaces.checkSpaceType');

    const settings = isChannel
      ? findSpace?.settings?.channel
      : findSpace?.settings?.group;
    const inviteOnly = settings?.joinApproval === JoinApproval.INVITE_ONLY;
    const needApproval = settings?.joinApproval === JoinApproval.NEED_APPROVAL;
    const isSecure = inviteOnly || needApproval;
    if (isSecure) throw new BadRequestException('spaces.isSecure');

    if ((isChannel || isGroup) && findSpace.parentSpace) {
      const parentSpaceId = new Types.ObjectId(findSpace.parentSpace);

      const parentSpace = await this.spacesRepository.findOne({
        query: { _id: parentSpaceId },
      });

      if (parentSpace && parentSpace.type === SpaceTypes.COMMUNITY) {
        const existingParentMember = await this.membersRepository.findOne({
          query: { space: parentSpaceId, user: userObjectId },
        });

        if (existingParentMember && existingParentMember.isBanned) {
          throw new BadRequestException('spaces.youAreBanned');
        }

        if (!existingParentMember || existingParentMember.isDeleted) {
          if (existingParentMember) {
            await this.membersRepository.updateOne({
              query: { _id: existingParentMember._id },
              dto: {
                isDeleted: false,
                deletedAt: null,
                role: SpaceMemberRole.MEMBER,
                permission: existingParentMember.permissions?.filter(
                  (perm: string) => memberPermissionList?.includes(perm),
                ),
                joinedAt: new Date(),
              },
            });
          } else {
            await this.membersRepository.createOne({
              dto: {
                user: userObjectId,
                space: parentSpaceId,
                role: SpaceMemberRole.MEMBER,
                joinedAt: new Date(),
                permissions: memberPermissionList,
              },
            });
          }

          await this.spacesRepository.updateOne({
            query: { _id: parentSpaceId },
            dto: { $inc: { membersCount: 1 } },
          });
        }
      }
    }

    const existingMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    if (existingMember && existingMember?.isBanned)
      throw new BadRequestException('spaces.youAreBanned');

    let member: any;
    if (existingMember) {
      member = await this.membersRepository.updateOne({
        query: { _id: existingMember?._id },
        dto: {
          isDeleted: false,
          deletedAt: null,
          role: SpaceMemberRole.MEMBER,
          permission: existingMember?.permissions?.filter((perm) =>
            memberPermissionList?.includes(perm),
          ),
          joinedAt: new Date(),
        },
      });
    } else {
      member = await this.membersRepository.createOne({
        dto: {
          user: userObjectId,
          space: spaceObjectId,
          role: SpaceMemberRole.MEMBER,
          joinedAt: new Date(),
          permissions: memberPermissionList,
        },
      });
    }

    const wasInactive = !existingMember || existingMember.isDeleted;
    let updatedSpace = findSpace;
    if (wasInactive) {
      const s = await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: { $inc: { membersCount: 1 } },
      });
      updatedSpace = s?.toObject();
    }

    if (findSpace.type === SpaceTypes.COMMUNITY) {
      const subSpaces = await this.spacesRepository.findLean({
        query: { parentSpace: spaceObjectId },
      });

      await Promise.all(
        subSpaces.map(async (subSpace: any) => {
          const existingSubMember = await this.membersRepository.findOne({
            query: { space: subSpace._id, user: userObjectId },
          });

          if (existingSubMember && existingSubMember.isBanned) return;

          if (existingSubMember) {
            await this.membersRepository.updateOne({
              query: { _id: existingSubMember._id },
              dto: {
                isDeleted: false,
                deletedAt: null,
                role: SpaceMemberRole.MEMBER,
                permission: existingSubMember.permissions?.filter(
                  (perm: string) => memberPermissionList?.includes(perm),
                ),
                joinedAt: new Date(),
              },
            });
          } else {
            await this.membersRepository.createOne({
              dto: {
                user: userObjectId,
                space: subSpace._id,
                role: SpaceMemberRole.MEMBER,
                joinedAt: new Date(),
                permissions: memberPermissionList,
              },
            });
          }

          const wasInactiveSub =
            !existingSubMember || existingSubMember.isDeleted;
          if (wasInactiveSub) {
            await this.spacesRepository.updateOne({
              query: { _id: subSpace._id },
              dto: { $inc: { membersCount: 1 } },
            });
          }
        }),
      );
    }

    return {
      ...updatedSpace,
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
        isOutgoing:
          findSpace?.lastMessage?.sender?.toString() ===
          userObjectId?.toString(),
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
