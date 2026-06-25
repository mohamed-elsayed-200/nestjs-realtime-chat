import {
  BadRequestException,
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
  JoinApproval,
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
          content: `${authUser?.name} updated the space wallpaper to "${dto?.wallpaper}"`,
          text: `${authUser?.name} updated the space wallpaper to "${dto?.wallpaper}"`,
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

  public async join({ spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    // check space already exist
    const findSpace = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId, type: SpaceTypes.CHANNEL },
    });
    if (!findSpace) throw new NotFoundException('spaces.notFound');

    // check is private channel
    const settings = findSpace.settings.channel;
    const inviteOnly = settings.joinApproval === JoinApproval.INVITE_ONLY;
    const needApproval = settings.joinApproval === JoinApproval.NEED_APPROVAL;
    const isPrivate = inviteOnly || needApproval;
    if (isPrivate) throw new BadRequestException('spaces.isPrivate');

    // check if member already joined
    const existingMember = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    if (existingMember) throw new BadRequestException('members.alreadyJoined');

    // create & join a new member
    const member = await this.membersRepository.createOne({
      dto: {
        user: userObjectId,
        space: spaceObjectId,
        role: SpaceMemberRole.MEMBER,
        joinedAt: new Date(),
        pin: false,
        mute: false,
        archive: false,
        permissions: [],
      },
    });

    const lastMessage = await this.messagesRepository.createOne({
      dto: {
        space: spaceObjectId,
        sender: userObjectId,
        messageType: MessageType.SYSTEM,
        status: MessageStatus.SENT,
        content: `${authUser?.name} joined`,
        text: `${authUser?.name} joined`,
      },
    });

    const updatedSpace = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { lastMessage: lastMessage?._id, $inc: { membersCount: 1 } },
    });

    return {
      ...updatedSpace.toObject(),
      unreadCount: member?.unreadCount,
      pin: member?.pin,
      mute: member?.mute,
      archive: member?.archive,
      folder: member?.folder,
      role: member?.role,
      permissions: member?.permissions,
      joinedAt: member?.joinedAt,
      wallpaper: member?.wallpaper,
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

  public async leave({ spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    const member = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId },
    });
    if (!member) throw new NotFoundException('members.notFound');

    if (member.role === SpaceMemberRole.OWNER)
      throw new BadRequestException('members.ownerCannotLeave');

    await this.membersRepository.deleteOne({
      query: { space: spaceObjectId, user: userObjectId },
    });

    const lastMessage = await this.messagesRepository.createOne({
      dto: {
        space: spaceObjectId,
        sender: userObjectId,
        messageType: MessageType.SYSTEM,
        status: MessageStatus.SENT,
        content: `${authUser?.name} leaved`,
        text: `${authUser?.name} leaved`,
      },
    });

    const updatedSpace = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { lastMessage: lastMessage?._id, $inc: { membersCount: -1 } },
    });
    return {
      ...updatedSpace.toObject(),
      unreadCount: 0,
      pin: false,
      mute: false,
      archive: false,
      folder: false,
      role: null,
      permissions: [],
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
}
