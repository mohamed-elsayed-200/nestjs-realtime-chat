import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import {
  MessageStatus,
  MessageType,
  SpaceMemberPermission,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';

@Injectable()
export class UpdateGlobalSpaceService {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly spacesRepository: SpacesRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async update({ spaceId, dto, authUser }) {
    const isGroup = dto?.type === SpaceTypes.GROUP;
    const isChannel = dto?.type === SpaceTypes.CHANNEL;
    const isCommunity = dto?.type === SpaceTypes.COMMUNITY;
    const isPrivate = dto?.type === SpaceTypes.PRIVATE;
    const isBot = dto?.type === SpaceTypes.BOT;
    if (isPrivate || isBot)
      throw new BadRequestException('spaces.checkSpaceType');

    if (isGroup && dto?.settings) {
      dto.settings.channel = null;
      dto.settings.community = null;
    }
    if (isChannel && dto?.settings) {
      dto.settings.group = null;
      dto.settings.community = null;
    }
    if (isCommunity && dto?.settings) {
      dto.settings.group = null;
      dto.settings.channel = null;
    }

    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser?._id);

    const member = await this.membersRepository.findOne({
      query: {
        user: userObjectId,
        space: spaceObjectId,
      },
    });

    if (!member) throw new NotFoundException('members.notFoundOne');

    const isOwner = member.role === SpaceMemberRole.OWNER;
    const isAdmin = member.role === SpaceMemberRole.ADMIN;

    const canAttempt = isOwner || isAdmin;
    if (!canAttempt)
      throw new InternalServerErrorException('spaces.notUpdated');

    const hasChangeSettings = member.permissions?.includes(
      SpaceMemberPermission.CHANGE_SETTINGS,
    );
    const hasAddSpacesPermission = member.permissions?.includes(
      SpaceMemberPermission.ADD_SPACES_IN_COMMUNITY,
    );
    const hasChangeInfo = member.permissions?.includes(
      SpaceMemberPermission.CHANGE_INFO,
    );

    const INFO_FIELDS = ['name', 'bio', 'avatar', 'profileColor', 'wallpaper'];

    if (!isOwner) {
      const { settings, type, ...rest } = dto ?? {};

      const touchesInfo = Object.keys(rest).some((k) =>
        INFO_FIELDS.includes(k),
      );

      const touchesUnknownTopLevel = Object.keys(rest).some(
        (k) => !INFO_FIELDS.includes(k),
      );

      let touchesCategories = false;
      let touchesOtherSettings = false;

      if (settings) {
        for (const key of Object.keys(settings)) {
          if (key === 'community') {
            const community = settings.community;
            if (community) {
              for (const ck of Object.keys(community)) {
                if (ck === 'categories') touchesCategories = true;
                else touchesOtherSettings = true;
              }
            }
          } else {
            touchesOtherSettings = true;
          }
        }
      }

      if (!hasChangeSettings) {
        if (touchesUnknownTopLevel || touchesOtherSettings) {
          throw new BadRequestException('spaces.noPermissionToUpdateSettings');
        }
        if (touchesCategories && !hasAddSpacesPermission) {
          throw new BadRequestException(
            'spaces.noPermissionToUpdateCategories',
          );
        }
        if (touchesInfo && !hasChangeInfo) {
          throw new BadRequestException('spaces.noPermissionToUpdateInfo');
        }
      }
    }

    const incomingCategories = dto?.settings?.community?.categories;
    if (isCommunity && incomingCategories && incomingCategories.length > 0) {
      dto.settings.community.categories = incomingCategories.map((cat: any) => {
        if (cat.id?.startsWith('temp-') && !cat.createdBy) {
          return { ...cat, createdBy: new Types.ObjectId(authUser._id) };
        }
        return cat;
      });

      if (!isOwner) {
        const existingSpace = await this.spacesRepository.findOne({
          query: { _id: spaceObjectId },
        });
        const existingCats =
          existingSpace?.settings?.community?.categories || [];

        for (const cat of dto.settings.community.categories) {
          if (cat.id?.startsWith('temp-')) continue;

          const existingCat = existingCats.find((c: any) => c.id === cat.id);

          if (existingCat && existingCat.createdBy) {
            const catCreator =
              existingCat.createdBy.toString?.() ||
              existingCat.createdBy?.toString?.() ||
              existingCat.createdBy;

            if (catCreator !== authUser._id.toString()) {
              throw new BadRequestException('spaces.notCategoryCreator');
            }
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
          _id: { $ne: spaceObjectId },
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

    const { type, ...updateDto } = dto;
    const space = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId, type },
      dto: updateDto,
    });

    if (!space) throw new InternalServerErrorException('spaces.notUpdated');

    if (dto?.wallpaper) {
      const updateWallpaper = await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { wallpaper: dto?.wallpaper, $inc: { unreadCount: 1 } },
      });

      const lastMessage = await this.messagesRepository.createOne({
        dto: {
          space: spaceObjectId,
          sender: userObjectId,
          messageType: MessageType.SYSTEM,
          status: MessageStatus.SENT,
          content: `${authUser?.name} updated the space wallpaper to "${dto?.wallpaper}"`,
          text: `${authUser?.name} updated the space wallpaper to "${dto?.wallpaper}"`,
        },
      });

      const spaceUpdated = await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: {
          lastMessage: lastMessage?._id,
        },
      });

      if (!updateWallpaper)
        new InternalServerErrorException('spaces.notUpdated');

      const systemMessage = {
        ...lastMessage?.toObject(),
        id: lastMessage?._id?.toString(),
        _id: undefined,
        sender: {
          name: authUser?.name,
          id: authUser?.id,
          username: authUser?.username,
          avatar: authUser?.avatar,
          profileColor: authUser?.profileColor,
        },
      };

      return {
        space: {
          ...spaceUpdated?.toObject(),
          id: spaceId,
          lastMessage: systemMessage,
        },
        systemMessage,
      };
    }

    return {
      space: {
        ...space?.toObject(),
        id: space?.id?.toString(),
        _id: undefined,
      },
    };
  }
}
