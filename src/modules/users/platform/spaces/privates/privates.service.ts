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

    // other user
    const findMember = await this.usersRepository.findOne({
      query: { _id: otherUserId },
      select: 'name profileColor avatar username bio',
    });

    if (!findMember) {
      throw new InternalServerErrorException('spaces.memberNotFound');
    }

    // Check if contact exists from both sides
    const [senderContact, receivedContact] = await Promise.all([
      this.contactsRepository.findOne({
        query: {
          me: userId,
          contact: otherUserId,
        },
        select: 'name profileColor avatar',
      }),
      this.contactsRepository.findOne({
        query: {
          me: otherUserId,
          contact: userId,
        },
        select: 'name profileColor avatar',
      }),
    ]);

    // Determine which contact to use (prefer sender's contact, then receiver's)
    const contactToUse = senderContact || receivedContact;

    // Private space
    const newSpace = {
      status: ActivationStatus.ACTIVE,
      type: SpaceTypes.PRIVATE,
      createdBy: userId,
      sender: userId,
      received: otherUserId,
      senderContact: senderContact?._id || null,
      receivedContact: receivedContact?._id || null,
      // For backward compatibility, you might want to add a virtual field
    };

    // Create space
    const space = await this.spacesRepository.createOne({
      dto: newSpace,
    });

    if (!space) {
      throw new InternalServerErrorException('spaces.notCreated');
    }

    // Members
    const members =
      otherUserId?.toString() === userId?.toString()
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
            pin: false,
            mute: false,
            archive: false,
          },
        }),
      ),
    );

    // Response
    return {
      ...space.toObject(),
      profileColor: contactToUse?.profileColor ?? findMember.profileColor,
      name: contactToUse?.name ?? findMember.name,
      avatar: contactToUse?.avatar ?? findMember.avatar,
      isContact: !!contactToUse,
      received: {
        _id: findMember._id,
        name: findMember.name,
        profileColor: findMember.profileColor,
        avatar: findMember.avatar,
        username: findMember.username,
      },
    };
  }
}
