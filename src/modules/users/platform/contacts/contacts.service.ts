import { UsersRepository } from './../../../../common/modules/iam/users/users.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserType } from './../../../../common/types/enums';
@Injectable()
export class ContactsService {
  constructor(private readonly contactsRepository: UsersRepository) {}
  public async getAll({ query }) {
    return this.contactsRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'email'],
        pipelines: [
          {
            $match: {
              userType: UserType.USER,
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              username: 1,
              avatar: 1,
              status: 1,
              roles: 1,
            },
          },
        ],
      },
    });
  }

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
}
