import { Types } from 'mongoose';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
import { MembersRepository } from '../../../../../common/modules/platform/members/members.repository';
import {
  ActivationStatus,
  SpaceMemberRole,
  SpaceTypes,
} from '../../../../../common/types/enums';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { ContactsRepository } from '../../../../../common/modules/platform/contacts/contacts.repository';

@Injectable()
export class CreatePrivateSpaceService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly membersRepository: MembersRepository,
    private readonly usersRepository: UsersRepository,
    private readonly contactsRepository: ContactsRepository,
  ) {}

  public async create({ dto, authUser }) {
    const { memberId } = dto;

    const userId = new Types.ObjectId(authUser._id);
    const otherUserId = new Types.ObjectId(memberId);

    const [findOtherUser, findAuthUser] = await Promise.all([
      this.usersRepository.findOne({
        query: { _id: otherUserId },
        select: 'name profileColor avatar username bio',
      }),
      this.usersRepository.findOne({
        query: { _id: userId },
        select: 'name profileColor avatar username bio',
      }),
    ]);

    if (!findOtherUser)
      throw new InternalServerErrorException('spaces.memberNotFound');

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

    const existingSpace = await this.spacesRepository.findOne({
      query: {
        type: SpaceTypes.PRIVATE,
        $or: [
          { sender: userId, received: otherUserId },
          { sender: otherUserId, received: userId },
        ],
      },
    });

    let space: any;

    if (existingSpace) {
      await this.membersRepository.updateOne({
        query: { space: existingSpace._id, user: userId },
        dto: { isDeleted: false },
      });
      space = existingSpace;
    } else {
      space = await this.spacesRepository.createOne({
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

      space = space.toObject();
    }

    const forRequester = this.buildSpaceView(
      space,
      senderContact,
      findOtherUser,
    );

    const forOtherUser = this.buildSpaceView(
      space,
      receivedContact,
      findAuthUser,
    );

    return { forRequester, forOtherUser };
  }

  private buildSpaceView(space: any, contact: any, otherUserData: any) {
    return {
      ...space,
      id: space._id?.toString() ?? space.id,
      _id: undefined,
      __v: undefined,
      profileColor: contact?.profileColor ?? otherUserData.profileColor,
      name: contact?.name ?? otherUserData.name,
      avatar: contact?.avatar ?? otherUserData.avatar,
      isContact: !!contact,
      received: {
        id: otherUserData._id,
        name: otherUserData.name,
        profileColor: otherUserData.profileColor,
        avatar: otherUserData.avatar,
        username: otherUserData.username,
      },
    };
  }
}
