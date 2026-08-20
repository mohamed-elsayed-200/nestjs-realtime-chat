import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ContactsRepository } from '../../../../../common/modules/platform/contacts/contacts.repository';
import { SpacesRepository } from '../../../../../common/modules/platform/spaces/spaces.repository';
@Injectable()
export class UpdateContactService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly contactsRepository: ContactsRepository,
  ) {}

  public async update({ contactId, dto, authUser }) {
    const contact = await this.contactsRepository.updateOne({
      query: {
        contact: new Types.ObjectId(contactId),
        me: new Types.ObjectId(authUser?._id),
      },
      dto,
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    await this.spacesRepository.updateMany({
      query: {
        sender: contact.contact.toString(),
      },
      dto: {
        senderContact: contact._id,
      },
    });

    await this.spacesRepository.updateMany({
      query: {
        received: contact.contact.toString(),
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
