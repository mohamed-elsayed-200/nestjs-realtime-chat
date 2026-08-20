import { Types } from 'mongoose';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import {
  ActivationStatus,
  adminPermissionList,
  memberPermissionList,
  SpaceMemberPermission,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';

@Injectable()
export class CreateGlobalSpaceService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  public async create({ dto, authUser }) {
    const isGroup = dto?.type === SpaceTypes.GROUP;
    const isChannel = dto?.type === SpaceTypes.CHANNEL;
    const isCommunity = dto?.type === SpaceTypes.COMMUNITY;
    const isPrivate = dto?.type === SpaceTypes.PRIVATE;
    const isBot = dto?.type === SpaceTypes.BOT;
    if (isPrivate || isBot)
      throw new NotFoundException('spaces.checkSpaceType');

    if (isGroup && dto?.settings) {
      dto.settings.channel = undefined;
      dto.settings.community = undefined;
    }
    if (isChannel && dto?.settings) {
      dto.settings.group = undefined;
      dto.settings.community = undefined;
    }
    if (isCommunity && dto?.settings) {
      dto.settings.group = undefined;
      dto.settings.channel = undefined;
    }
    let finalSettings = dto?.settings;
    if (isCommunity && finalSettings?.community?.categories?.length > 0) {
      finalSettings = {
        ...finalSettings,
        community: {
          ...finalSettings.community,
          categories: finalSettings.community.categories.map((cat) => ({
            ...cat,
            createdBy: new Types.ObjectId(authUser._id),
          })),
        },
      };
    }

    const members = [
      ...(dto?.members || []).filter((id) => id !== authUser._id.toString()),
      authUser._id.toString(),
    ];

    const newSpace = {
      name: dto?.name,
      bio: dto?.bio,
      avatar: dto?.avatar,
      profileColor: dto?.profileColor || this.usersRepository.getRandomColor(),
      wallpaper: dto?.wallpaper || undefined,
      settings: finalSettings,
      isArchived: false,
      status: ActivationStatus.ACTIVE,
      type: dto?.type,
      createdBy: new Types.ObjectId(authUser._id),
      membersCount: members?.length,
      parentSpace:
        (isGroup || isChannel) && dto?.parentSpace
          ? new Types.ObjectId(dto?.parentSpace)
          : undefined,
    };

    if (newSpace.parentSpace && (isGroup || isChannel)) {
      const parentSpace = await this.spacesRepository.findOne({
        query: { _id: newSpace.parentSpace },
      });

      if (!parentSpace) throw new NotFoundException('spaces.parentNotFound');

      if (parentSpace.type === SpaceTypes.COMMUNITY) {
        const parentMember = await this.membersRepository.findOne({
          query: {
            user: new Types.ObjectId(authUser._id),
            space: newSpace.parentSpace,
          },
        });

        if (!parentMember)
          throw new BadRequestException('spaces.noPermissionToAddSpace');

        const isOwner = parentMember.role === SpaceMemberRole.OWNER;
        const isAdmin = parentMember.role === SpaceMemberRole.ADMIN;

        if (!isOwner) {
          if (!isAdmin) {
            throw new BadRequestException('spaces.noPermissionToAddSpace');
          }

          const hasAddSpacePermission = parentMember.permissions?.includes(
            SpaceMemberPermission.ADD_SPACES_IN_COMMUNITY,
          );

          if (!hasAddSpacePermission) {
            throw new BadRequestException('spaces.noPermissionToAddSpace');
          }
        }
      }
    }

    const linkToCheck = isChannel
      ? dto?.settings?.channel?.channelLink
      : isGroup
        ? dto?.settings?.group?.groupLink
        : isCommunity
          ? dto?.settings?.community?.communityLink
          : null;

    if (linkToCheck) {
      const findSpace = await this.spacesRepository.findOne({
        query: {
          $or: [
            { 'settings.channel.channelLink': linkToCheck },
            { 'settings.group.groupLink': linkToCheck },
            { 'settings.community.communityLink': linkToCheck },
          ],
        },
      });

      if (findSpace)
        throw new BadRequestException('spaces.spaceLinkAlreadyUsed');
    }

    const space = await this.spacesRepository.createOne({ dto: newSpace });
    if (!space) throw new InternalServerErrorException('spaces.notCreated');

    if (newSpace.parentSpace && (isGroup || isChannel)) {
      const incField = isChannel ? 'channelsCount' : 'groupsCount';
      await this.spacesRepository.updateOne({
        query: { _id: newSpace.parentSpace },
        dto: { $inc: { [incField]: 1 } },
      });
    }

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
            permission: [...memberPermissionList, ...adminPermissionList],
            joinedAt: new Date(),
            isPined: false,
            isMuted: false,
            isArchived: false,
            adminTag: authUser._id.toString() === id ? 'Owner' : undefined,
            adminTagColor:
              authUser._id.toString() === id ? '#22c55e' : undefined,
          },
        }),
      ),
    );

    return space;
  }
}
