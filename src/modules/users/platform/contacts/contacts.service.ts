import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ContactsRepository } from './../../../../common/modules/platform/contacts/contacts.repository';
@Injectable()
export class ContactsService {
  constructor(private readonly contactsRepository: ContactsRepository) {}
  // get all contacts
  public async getAll({ query, authUser }) {
    return this.contactsRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name'],
        pipelines: [
          {
            $match: {
              me: new Types.ObjectId(authUser._id),
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'contact',
              foreignField: '_id',
              as: 'contactObj',
            },
          },
          {
            $project: {
              name: 1,
              _id: '$contactObj._id',
              username: '$contactObj.username',
              email: '$contactObj.email',
              avatar: '$contactObj.avatar',
              profileColor: '$contactObj.profileColor',
            },
          },
        ],
      },
    });
  }

  // get contact by id
  public async getOne({ contactId }) {
    const findContact = await this.contactsRepository.findOne({
      query: { _id: contactId },
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

  // create contact
  public async create({}) {}
}
