import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../../../../common/modules/iam/users/users.repository';
import { ContactsRepository } from '../../../../common/modules/platform/contacts/contacts.repository';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
@Injectable()
export class ContactsService {
  constructor(
    private readonly spacesRepository: SpacesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly contactsRepository: ContactsRepository,
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
