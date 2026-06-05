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
            $unwind: '$contactObj',
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

  // create contact
  public async create({ dto, authUser }) {
    const { userId, name } = dto;

    const getUser = await this.usersRepository.findOne({
      query: { _id: userId },
    });

    if (!getUser || getUser?._id?.toString() === authUser?._id?.toString()) {
      throw new NotFoundException('users.notFound');
    }

    const alreadyExist = await this.contactsRepository.findOne({
      query: { contact: getUser._id, me: authUser._id },
    });
    if (alreadyExist) throw new ConflictException('contacts.alreadyExist');

    const newContact = await this.contactsRepository.createOne({
      dto: {
        name,
        contact: getUser._id,
        me: authUser?._id,
      },
    });

    return newContact;
  }

  // update contact
  public async update({ contactId, dto, authUser }) {
    const { name, avatar } = dto;
    console.log(contactId, authUser?._id);

    const updatedContact = await this.contactsRepository.updateOne({
      query: { contact: contactId, me: authUser._id },
      dto: { name, avatar },
    });
    if (!updatedContact) throw new NotFoundException('contacts.notFound');

    return updatedContact;
  }

  // delete contact
  public async delete({ contactId, authUser }) {
    const findContact = await this.contactsRepository.deleteOne({
      query: { contact: contactId, me: authUser._id },
      populate: [
        {
          path: 'contact',
          model: 'User',
          select: 'name profileColor username avatar',
        },
      ],
    });
    if (!findContact) throw new NotFoundException('contacts.notFound');

    return findContact;
  }
}
