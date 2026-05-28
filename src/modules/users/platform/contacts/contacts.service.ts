import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ContactsRepository } from './../../../../common/modules/platform/contacts/contacts.repository';
import { UsersRepository } from '../../../../common/modules/iam/users/users.repository';

@Injectable()
export class ContactsService {
  constructor(
    private readonly contactsRepository: ContactsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

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
  public async getOne({ contactId, authUser }) {
    const findContact = await this.contactsRepository.findOne({
      query: { _id: contactId, me: authUser._id },
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
  public async create({ dto, authUser }) {
    const { email, name } = dto;
    const getUserByEmail = await this.usersRepository.findOne({
      query: { email },
    });
    if (!getUserByEmail || getUserByEmail?.email === authUser?.email)
      throw new NotFoundException('users.notFound');

    const alreadyExist = await this.contactsRepository.findOne({
      query: { contact: getUserByEmail._id, me: authUser._id },
    });
    if (alreadyExist) throw new ConflictException('contacts.alreadyExist');

    const newContact = await this.contactsRepository.createOne({
      dto: {
        name,
        contact: getUserByEmail._id,
        me: authUser?._id,
      },
    });

    return newContact;
  }

  // update contact
  public async update({ contactId, dto, authUser }) {
    const { name } = dto;

    const findContact = await this.contactsRepository.findOne({
      query: { _id: contactId, me: authUser._id },
    });
    if (!findContact) throw new NotFoundException('contacts.notFound');

    const updatedContact = await this.contactsRepository.updateOne({
      query: { _id: contactId },
      dto: { name },
    });

    return updatedContact;
  }

  // delete contact
  public async delete({ contactId, authUser }) {
    const findContact = await this.contactsRepository.findOne({
      query: { _id: contactId, me: authUser._id },
    });
    if (!findContact) throw new NotFoundException('contacts.notFound');

    await this.contactsRepository.deleteOne({
      query: { _id: contactId },
    });

    return { message: 'contacts.deleted' };
  }
}
