import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { ContactsRepository } from '../../../../../common/modules/platform/contacts/contacts.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
@Injectable()
export class DeleteContactService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly contactsRepository: ContactsRepository,
  ) {}

  public async delete({ contactId, authUser }) {
    const contact = await this.contactsRepository.deleteOne({
      query: {
        contact: new Types.ObjectId(contactId),
        me: new Types.ObjectId(authUser._id),
      },
    });

    if (!contact) throw new NotFoundException('Contact not found');
    const userData = await this.usersRepository.findOne({
      query: { _id: contact.contact.toString() },
      select: 'name avatar profileColor username',
    });

    await this.spacesRepository.updateMany({
      query: {
        sender: contact.contact.toString(),
      },
      dto: {
        senderContact: null,
      },
    });

    await this.spacesRepository.updateMany({
      query: {
        received: contact.contact.toString(),
      },
      dto: {
        receivedContact: null,
      },
    });

    return {
      name: userData?.name,
      profileColor: userData?.profileColor,
      avatar: userData?.avatar,
      _id: userData?._id,
    };
  }
}
