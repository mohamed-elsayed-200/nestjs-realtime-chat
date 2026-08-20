import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactsRepository } from '../../../../../common/modules/platform/contacts/contacts.repository';
@Injectable()
export class GetSingleContactService {
  constructor(private readonly contactsRepository: ContactsRepository) {}

  public async getOne({ contactId, authUser }) {
    const findContact = await this.contactsRepository.findOne({
      query: { contact: contactId, me: authUser._id },
      populate: [
        {
          path: 'contact',
          model: 'users',
          select: 'name email profileColor avatar username',
        },
      ],
    });

    if (!findContact) throw new NotFoundException('contacts.notFound');
    const contact = findContact?.contact;

    return {
      name: findContact?.name,
      ...contact,
    };
  }
}
