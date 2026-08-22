import { Types } from 'mongoose';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { ContactsRepository } from '../../../../../common/modules/platform/contacts/contacts.repository';
import { MessagesRepository } from '../../../../../common/modules/platform/messages/messages.repository';
import { JoinRequestsRepository } from '../../../../../common/modules/platform/join-requests/join-requests.repository';
import { UsersRepository } from './../../../../../common/modules/iam/users/users.repository';
import { BannedRepository } from '../../../../../common/modules/platform/banned/banned.repository';
import { CallsRepository } from './../../../../../common/modules/platform/calls/calls.repository';
import { Injectable } from '@nestjs/common';
import { CallStatus, SpaceTypes } from '../../../../../common/types/enums';

@Injectable()
export class GetSingleSpaceService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly contactsRepository: ContactsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly callsRepository: CallsRepository,
    private readonly bannedRepository: BannedRepository,
  ) {}

  public async get({ spaceOrUserId, authUser }) {
    const userId = new Types.ObjectId(authUser._id);
    const spaceId = new Types.ObjectId(spaceOrUserId);

    const member = await this.membersRepository.findOne({
      query: { space: spaceId, user: userId },
    });

    const isMember = Boolean(member?._id);

    const findSpace: any = await this.spacesRepository.findOne({
      query: { _id: spaceId },
      populate: [
        {
          path: 'createdBy',
          model: 'User',
          select: 'name avatar profileColor username',
        },
        {
          path: 'sender',
          select: '_id name username avatar profileColor bio',
        },
        {
          path: 'received',
          select: '_id name username avatar profileColor bio',
        },
        {
          path: 'senderContact',
          select: '_id name avatar profileColor',
        },
        {
          path: 'receivedContact',
          select: '_id name avatar profileColor',
        },
      ],
    });

    if (findSpace) {
      const isPrivate = findSpace?.type === SpaceTypes.PRIVATE;

      const activeCall = await this.callsRepository.findOne({
        query: {
          space: spaceId,
          status: {
            $in: [
              CallStatus.INITIATED,
              CallStatus.RINGING,
              CallStatus.IN_PROGRESS,
            ],
          },
        },
      });

      const effectiveLastMessageId = isPrivate
        ? member?.lastMessage
        : findSpace?.lastMessage;

      let lastMessageData = null;
      if (effectiveLastMessageId) {
        lastMessageData = await this.messagesRepository.findOne({
          query: { _id: effectiveLastMessageId },
          select: '_id sender status text createdAt',
        });
      }

      let userContact = null;
      let otherParty = null;
      let iBlockedThem = false;
      let theyBlockedMe = false;

      if (isPrivate) {
        if (findSpace?.sender?._id.toString() === userId.toString()) {
          otherParty = findSpace?.received;
        } else {
          otherParty = findSpace?.sender;
        }

        userContact = await this.contactsRepository.findOne({
          query: {
            me: userId,
            contact: otherParty?._id,
          },
          select: '_id name avatar profileColor',
        });

        if (otherParty?._id) {
          const result = await this.bannedRepository.findBothDirections({
            userA: userId.toString(),
            userB: otherParty._id.toString(),
          });
          iBlockedThem = Boolean(result.iBlockedThem);
          theyBlockedMe = Boolean(result.theyBlockedMe);
        }
      }

      const dataMember = isMember
        ? {
            unreadCount: member?.unreadCount,
            isPined: member?.isPined,
            isMuted: member?.isMuted,
            isArchived: member?.isArchived,
            folder: member?.folder,
            role: member?.role,
            permissions: member?.permissions,
            joinedAt: member?.joinedAt,
            isBanned: member?.isBanned,
            bannedAt: member?.bannedAt,
            isDeleted: member?.isDeleted,
            adminTag: member?.adminTag,
            adminTagColor: member?.adminTagColor,
            received: isPrivate
              ? {
                  id: otherParty?._id,
                  name: otherParty?.name,
                  username: otherParty?.username,
                  avatar: theyBlockedMe ? null : otherParty?.avatar,
                  profileColor: otherParty?.profileColor,
                  bio: otherParty?.bio,
                }
              : null,

            lastMessage: lastMessageData
              ? {
                  isOutgoing:
                    lastMessageData.sender?._id?.toString() ===
                    userId.toString(),
                  id: lastMessageData._id,
                  status: lastMessageData.status,
                  text: lastMessageData.text,
                  createdAt: lastMessageData.createdAt,
                }
              : null,
          }
        : {};

      const messageStats = await this.messagesRepository.getMessageStatistics({
        spaceId,
      });
      const statistics = messageStats.reduce(
        (acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        },
        {} as Record<string, number>,
      );

      const response = {
        id: findSpace?._id,
        type: findSpace?.type,
        status: findSpace?.status,
        createdAt: findSpace?.createdAt,
        updatedAt: findSpace?.updatedAt,
        membersCount: findSpace?.membersCount,
        channelsCount: findSpace?.channelsCount,
        groupsCount: findSpace?.groupsCount,
        parentSpace: findSpace?.parentSpace,
        settings: findSpace?.settings,
        bio: findSpace?.bio || otherParty?.bio,
        createdBy: findSpace?.createdBy,
        wallpaper: member?.wallpaper || findSpace?.wallpaper,
        isActiveCall: Boolean(activeCall),
        activeCallType: activeCall?.type ?? null,
        activeCallId: activeCall?._id?.toString() ?? null,
        statistics,
        name: isPrivate
          ? userContact?.name || otherParty?.name || null
          : findSpace?.name,

        avatar: isPrivate
          ? theyBlockedMe
            ? null
            : userContact?.avatar || otherParty?.avatar || null
          : findSpace?.avatar,

        profileColor: isPrivate
          ? userContact?.profileColor || otherParty?.profileColor || null
          : findSpace?.profileColor,

        isContact: isPrivate ? !!userContact : false,
        iBlockedThem: isPrivate ? iBlockedThem : false,
        theyBlockedMe: isPrivate ? theyBlockedMe : false,

        ...dataMember,
      };

      return response;
    } else {
      const user = await this.usersRepository.findOne({
        query: { _id: spaceId },
      });

      const findContact = await this.contactsRepository.findOne({
        query: {
          me: userId,
          contact: user?._id,
        },
        select: '_id name avatar profileColor',
      });

      let iBlockedThem = false;
      let theyBlockedMe = false;

      if (user?._id) {
        const result = await this.bannedRepository.findBothDirections({
          userA: userId.toString(),
          userB: user._id.toString(),
        });
        iBlockedThem = Boolean(result.iBlockedThem);
        theyBlockedMe = Boolean(result.theyBlockedMe);
      }

      const response = {
        id: user?._id,
        unreadCount: 0,
        isPined: false,
        isMuted: false,
        isArchived: false,
        type: SpaceTypes.PRIVATE,
        bio: user?.bio,
        name: findContact?.name || user?.name,
        username: user?.username,
        avatar: theyBlockedMe ? null : findContact?.avatar || user?.avatar,
        profileColor: findContact?.profileColor || user?.profileColor,
        isContact: findContact?._id ? true : false,
        iBlockedThem,
        theyBlockedMe,
        isActiveCall: false,
        activeCallType: null,
        activeCallId: null,

        received: {
          id: user?._id,
          name: findContact?.name || user?.name,
          avatar: theyBlockedMe ? null : findContact?.avatar || user?.avatar,
          profileColor: findContact?.profileColor || user?.profileColor,
          username: user?.username,
          bio: user?.bio,
        },
      };

      return response;
    }
  }
}
