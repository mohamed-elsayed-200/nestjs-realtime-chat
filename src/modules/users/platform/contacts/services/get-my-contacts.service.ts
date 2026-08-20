import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ContactsRepository } from '../../../../../common/modules/platform/contacts/contacts.repository';

@Injectable()
export class GetMyContactsService {
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
            $unwind: '$contactObj',
          },
          {
            $project: {
              _id: '$contactObj._id',
              name: 1,
              avatar: 1,
              profileColor: 1,
            },
          },
        ],
      },
    });
  }
}
