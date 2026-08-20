import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { ContactsRepository } from '../../../../../common/modules/platform/contacts/contacts.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
@Injectable()
export class CreateContactService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly contactsRepository: ContactsRepository,
  ) {}

  public async create({ dto, authUser }) {
    const { userId, name, avatar, profileColor } = dto;

    const findUser = await this.usersRepository.findOne({
      query: { _id: userId },
    });

    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const contact = await this.contactsRepository.createOne({
      dto: {
        name: name || findUser.name,
        avatar: avatar || findUser.avatar,
        profileColor: profileColor || findUser.profileColor,
        me: new Types.ObjectId(authUser?._id),
        contact: new Types.ObjectId(userId),
      },
    });

    await this.spacesRepository.updateMany({
      query: {
        sender: userId,
      },
      dto: {
        senderContact: contact._id,
      },
    });

    await this.spacesRepository.updateMany({
      query: {
        received: userId,
      },
      dto: {
        receivedContact: contact._id,
      },
    });

    return {
      _id: contact.contact._id,
      name: contact?.name,
      profileColor: contact?.profileColor,
      avatar: contact?.avatar,
    };
  }
}
