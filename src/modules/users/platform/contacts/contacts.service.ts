import { UsersRepository } from './../../../../common/modules/iam/users/users.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserType } from './../../../../common/types/enums';
import { Types } from 'mongoose';
@Injectable()
export class ContactsService {
  constructor(private readonly contactsRepository: UsersRepository) {}
  // get all contacts
  public async getAll({ query, authUser }) {
    return this.contactsRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'email'],
        pipelines: [
          {
            $match: {
              userType: UserType.USER,
              _id: { $ne: new Types.ObjectId(authUser?._id) },
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              username: 1,
              avatar: 1,
              status: 1,
              profileColor: 1,
            },
          },
        ],
      },
    });
  }

  // get contact by id
  public async getOne({ contactId }) {
    const contact = await this.contactsRepository.findOne({
      query: { _id: contactId },
    });
    if (!contact) throw new NotFoundException('contacts.notFound');
    return {
      name: contact?.name,
      email: contact?.email,
      username: contact?.username,
      avatar: contact?.avatar,
      status: contact?.status,
      roles: contact?.roles,
    };
  }

  // create contact
  public async create({}) {}
}
