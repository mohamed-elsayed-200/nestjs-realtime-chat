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
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { ContactsRepository } from '../../../../../common/modules/platform/contacts/contacts.repository';
import {
  ActivationStatus,
  JoinApproval,
  MessageStatus,
  MessageType,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly contactsRepository: ContactsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  public async create({ dto, authUser }) {
    const newSpace = {
      name: dto?.name,
      bio: dto?.bio,
      avatar: dto?.avatar,
      profileColor: dto?.profileColor || this.usersRepository.getRandomColor(),
      wallpaper: dto?.wallpaper || undefined,
      settings: dto?.settings,

      isArchived: false,
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.CHANNEL,
      createdBy: new Types.ObjectId(authUser._id),
      membersCount: 1,
    };

    const findSpace = await this.spacesRepository.findOne({
      query: {
        $or: [
          {
            'settings.channel.channelLink': dto?.settings?.channel?.channelLink,
          },
          {
            'settings.group.groupLink': dto?.settings?.channel?.channelLink,
          },
        ],
      },
    });
    if (findSpace)
      throw new BadRequestException('spaces.channelLinkAlreadyUsed');

    const space = await this.spacesRepository.createOne({ dto: newSpace });
    if (!space) throw new InternalServerErrorException('spaces.notCreated');

    await this.membersRepository.createOne({
      dto: {
        user: new Types.ObjectId(authUser._id),
        space: new Types.ObjectId(space._id?.toString()),
        role: SpaceMemberRole.OWNER,
        joinedAt: new Date(),
        isPined: false,
        isMuted: false,
        isArchived: false,
        adminTag: 'Owner',
        adminTagColor: '#22c55e',
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
      member.role === SpaceMemberRole.ADMIN;

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

  public async addSubscribes({ spaceId, dto, authUser }) {
    const { contacts } = dto;
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    // 1. Check owner
    const member = await this.membersRepository.findOne({
      query: { space: spaceObjectId, user: userObjectId, isDeleted: false },
    });
    if (!member) throw new NotFoundException('members.notFound');
    if (member.role !== SpaceMemberRole.OWNER)
      throw new BadRequestException('spaces.cantAddMembers');

    // 2. Get valid contacts
    const contactDocs = await this.contactsRepository.findMany({
      query: {
        contact: { $in: contacts.map((id) => new Types.ObjectId(id)) },
        me: userObjectId,
      },
      select: 'contact',
    });
    if (contactDocs.length === 0)
      throw new NotFoundException('contacts.notFound');

    // 3. Dedupe user IDs
    const userIds = [...new Set(contactDocs.map((c) => c.contact.toString()))];

    // 4. Get existing members (active + deleted)
    const existing = await this.membersRepository.findMany({
      query: {
        space: spaceObjectId,
        user: { $in: userIds.map((id) => new Types.ObjectId(id)) },
      },
      select: 'user isDeleted',
    });

    // 5. Build lookup map: userId → isDeleted
    const existingMap = new Map(
      existing.map((m) => [m.user.toString(), m.isDeleted]),
    );

    const toRestore: string[] = [];
    const toInsert: string[] = [];

    for (const id of userIds) {
      const isDeleted = existingMap.get(id);
      if (isDeleted === undefined)
        toInsert.push(id); // مش موجود → insert
      else if (isDeleted === true) toRestore.push(id); // ممسوح → restore
      // else active → skip
    }

    // 6. Restore deleted
    if (toRestore.length > 0) {
      await this.membersRepository.updateMany({
        query: {
          space: spaceObjectId,
          user: { $in: toRestore.map((id) => new Types.ObjectId(id)) },
          isDeleted: true,
        },
        dto: {
          isDeleted: false,
          isBanned: false,
          bannedAt: null,
          deletedAt: null,
          joinedAt: new Date(),
        },
      });
    }

    // 7. Insert new
    if (toInsert.length > 0) {
      await this.membersRepository.insertMany({
        documents: toInsert.map((userId) => ({
          user: new Types.ObjectId(userId),
          space: spaceObjectId,
          role: SpaceMemberRole.MEMBER,
          joinedAt: new Date(),
          isPined: false,
          isMuted: false,
          isArchived: false,
          permissions: [],
        })),
      });
    }

    // 8. Update count
    const total = toRestore.length + toInsert.length;
    if (total === 0) {
      return this.spacesRepository.findOne({ query: { _id: spaceObjectId } });
    }

    return this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { $inc: { membersCount: total } },
    });
  }

  public async join({ spaceId, authUser }) {
    const spaceObjectId = new Types.ObjectId(spaceId);
    const userObjectId = new Types.ObjectId(authUser._id);

    // check space already exist
    const findSpace: any = await this.spacesRepository.findOne({
      query: { _id: spaceObjectId, type: SpaceTypes.CHANNEL },
      populate: [
        {
          path: 'lastMessage',
          model: 'Message',
        },
      ],
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
    if (existingMember && existingMember?.isBanned)
      throw new BadRequestException('spaces.isPrivate');

    let member: any;
    if (existingMember) {
      member = await this.membersRepository.updateOne({
        query: { _id: existingMember?._id },
        dto: {
          isDeleted: false,
          deletedAt: null,
          role: SpaceMemberRole.MEMBER,
          permission: [],
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
          isPined: false,
          isMuted: false,
          isArchived: false,
          permissions: [],
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

    return {
      ...updatedSpace,
      unreadCount: member?.unreadCount,
      isPined: member?.isPined,
      isMuted: member?.isMuted,
      isArchived: member?.isArchived,
      folder: member?.folder,
      role: member?.role,
      permissions: member?.permissions,
      joinedAt: member?.joinedAt,
      wallpaper: member?.wallpaper,
      lastMessage: {
        ...findSpace?.lastMessage,
        isOutgoing:
          findSpace?.lastMessage?.sender?.toString() ===
          userObjectId?.toString(),
        sender: {
          name: authUser?.name,
          id: authUser?.id,
          username: authUser?.username,
          avatar: authUser?.avatar,
          profileColor: authUser?.profileColor,
        },
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

    await this.membersRepository.updateOne({
      query: { space: spaceObjectId, user: userObjectId },
      dto: {
        isDeleted: true,
        deletedAt: new Date(),
        joinedAt: null,
        role: null,
        permission: [],
      },
    });

    const updatedSpace = await this.spacesRepository.updateOne({
      query: { _id: spaceObjectId },
      dto: { $inc: { membersCount: -1 } },
    });
    return updatedSpace;
  }
}
