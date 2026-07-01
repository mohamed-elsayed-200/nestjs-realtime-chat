import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { ContactsRepository } from '../../../../../common/modules/platform/contacts/contacts.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import {
  ActivationStatus,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';

@Injectable()
export class PrivatesService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly contactsRepository: ContactsRepository,
  ) {}

  public async createPrivate({ dto, authUser }) {
    const { memberId } = dto;

    const userId = new Types.ObjectId(authUser._id);
    const otherUserId = new Types.ObjectId(memberId);

    const findUser = await this.usersRepository.findOne({
      query: { _id: otherUserId },
      select: 'name profileColor avatar username bio',
    });

    if (!findUser)
      throw new InternalServerErrorException('spaces.memberNotFound');

    const existingSpace = await this.spacesRepository.findOne({
      query: {
        type: SpaceTypes.PRIVATE,
        $or: [
          { sender: userId, received: otherUserId },
          { sender: otherUserId, received: userId },
        ],
      },
    });

    if (existingSpace) {
      await this.membersRepository.updateOne({
        query: {
          space: existingSpace._id,
          user: userId,
        },
        dto: { deleted: false },
      });

      const [senderContact, receivedContact] = await Promise.all([
        this.contactsRepository.findOne({
          query: { me: userId, contact: otherUserId },
          select: 'name profileColor avatar',
        }),
        this.contactsRepository.findOne({
          query: { me: otherUserId, contact: userId },
          select: 'name profileColor avatar',
        }),
      ]);
      const contactToUse = senderContact || receivedContact;

      return {
        ...existingSpace,
        profileColor: contactToUse?.profileColor ?? findUser.profileColor,
        name: contactToUse?.name ?? findUser.name,
        avatar: contactToUse?.avatar ?? findUser.avatar,
        isContact: !!contactToUse,
        received: {
          _id: findUser._id,
          name: findUser.name,
          profileColor: findUser.profileColor,
          avatar: findUser.avatar,
          username: findUser.username,
        },
      };
    }

    const [senderContact, receivedContact] = await Promise.all([
      this.contactsRepository.findOne({
        query: { me: userId, contact: otherUserId },
        select: 'name profileColor avatar',
      }),
      this.contactsRepository.findOne({
        query: { me: otherUserId, contact: userId },
        select: 'name profileColor avatar',
      }),
    ]);
    const contactToUse = senderContact || receivedContact;

    const space = await this.spacesRepository.createOne({
      dto: {
        status: ActivationStatus.ACTIVE,
        type: SpaceTypes.PRIVATE,
        createdBy: userId,
        sender: userId,
        received: otherUserId,
        senderContact: senderContact?._id || null,
        receivedContact: receivedContact?._id || null,
      },
    });

    if (!space) throw new InternalServerErrorException('spaces.notCreated');

    const members =
      otherUserId.toString() === userId.toString()
        ? [userId]
        : [otherUserId, userId];

    await Promise.all(
      members.map((id) =>
        this.membersRepository.createOne({
          dto: {
            user: id,
            space: new Types.ObjectId(space._id.toString()),
            role:
              id.toString() === userId.toString()
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

    return {
      ...space.toObject(),
      profileColor: contactToUse?.profileColor ?? findUser.profileColor,
      name: contactToUse?.name ?? findUser.name,
      avatar: contactToUse?.avatar ?? findUser.avatar,
      isContact: !!contactToUse,
      received: {
        _id: findUser._id,
        name: findUser.name,
        profileColor: findUser.profileColor,
        avatar: findUser.avatar,
        username: findUser.username,
      },
    };
  }
}
