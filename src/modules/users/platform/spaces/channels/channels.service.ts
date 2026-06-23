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
  MessageStatus,
  MessageType,
  SpaceMemberPermission,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async create({ dto, authUser }) {
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
        permissions: [
          SpaceMemberPermission.ADD_STORIES,
          SpaceMemberPermission.EDIT_STORIES,
          SpaceMemberPermission.DELETE_STORIES,
          SpaceMemberPermission.DELETE_MESSAGES,
          SpaceMemberPermission.BAN_USERS,
          SpaceMemberPermission.INVITE_USERS_VIA_LINK,
          SpaceMemberPermission.PIN_MESSAGES,
          SpaceMemberPermission.ADD_ADMIN,
          SpaceMemberPermission.CHANGE_SPACE_INFO,
          SpaceMemberPermission.EDIT_MEMBER_TAGS,
          SpaceMemberPermission.MANAGE_LIVE_STREAMS,
        ],
      },
    });

    return space;
  }

  public async update({ spaceId, dto, authUser }) {
    const { wallpaper } = dto;
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

    // Update wallpaper
    if (wallpaper) {
      const updateWallpaper = await this.membersRepository.updateMany({
        query: { space: spaceObjectId },
        dto: { wallpaper, $inc: { unreadCount: 1 } },
      });

      const lastMessage = await this.messagesRepository.createOne({
        dto: {
          space: spaceObjectId,
          sender: userObjectId,
          messageType: MessageType.SYSTEM,
          status: MessageStatus.SENT,
          content: `${authUser?.name} updated the chat wallpaper to "${dto?.wallpaper}"`,
          text: `${authUser?.name} updated the chat wallpaper to "${dto?.wallpaper}"`,
        },
      });

      await this.spacesRepository.updateOne({
        query: { _id: spaceObjectId },
        dto: {
          lastMessage: lastMessage?._id,
        },
      });

      if (!updateWallpaper)
        new InternalServerErrorException('spaces.notUpdated');

      return {
        ...dto,
        id: spaceId,
        lastMessage: {
          ...lastMessage.toObject(),
          sender: {
            name: authUser?.name,
            id: authUser?.id,
            username: authUser?.username,
            avatar: authUser?.avatar,
            profileColor: authUser?.profileColor,
          },
          isOutgoing:
            lastMessage?.sender?.toString() === userObjectId?.toString(),
        },
      };
    }

    return space;
  }
}
