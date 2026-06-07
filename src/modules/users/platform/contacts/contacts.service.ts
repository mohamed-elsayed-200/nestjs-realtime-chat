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
              me: 1,
              name: 1,
              contact: '$contactObj',
              avatar: '$contactObj.avatar',
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
    const { contactId, name, avatar, profileColor } = dto;
    const userId = new Types.ObjectId(authUser._id);

    const contactUser = await this.usersRepository.findOne({
      query: { _id: contactId },
    });

    if (!contactUser) {
      throw new NotFoundException('User not found');
    }

    const contact = await this.contactsRepository.createOne({
      dto: {
        name: name || contactUser.name,
        avatar: avatar || contactUser.avatar,
        profileColor: profileColor || contactUser.profileColor,
        me: userId,
        contact: new Types.ObjectId(contactId),
      },
    });

    await this.syncContactToSpaces(contactId, contact);

    return contact;
  }

  public async update({ contactId, dto, authUser }) {
    const userId = new Types.ObjectId(authUser._id);

    const contact = await this.contactsRepository.updateOne({
      query: { _id: contactId, me: userId },
      dto,
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.syncContactToSpaces(contact.contact.toString(), contact);

    return contact;
  }

  public async delete({ contactId, authUser }) {
    const userId = new Types.ObjectId(authUser._id);

    const contact = await this.contactsRepository.findOne({
      query: { _id: contactId, me: userId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.contactsRepository.deleteOne({
      query: { _id: contactId, me: userId },
    });

    await this.removeContactFromSpaces(contact.contact.toString());

    return { success: true };
  }

  private async syncContactToSpaces(contactUserId: string, contact: any) {
    const contactObjectId = new Types.ObjectId(contactUserId);

    await this.spacesRepository.updateMany({
      query: {
        'sender._id': contactObjectId,
        $or: [
          { 'sender._id': contactObjectId },
          { 'received._id': contactObjectId },
        ],
      },
      dto: {
        'sender.name': contact.name,
        'sender.avatar': contact.avatar,
        'sender.profileColor': contact.profileColor,
        'sender.isContact': true,
        'sender.contactName': contact.name,
        'sender.contactProfileColor': contact.profileColor,
        'sender.contactAvatar': contact.avatar,
      },
    });

    await this.spacesRepository.updateMany({
      query: {
        'received._id': contactObjectId,
        $or: [
          { 'sender._id': contactObjectId },
          { 'received._id': contactObjectId },
        ],
      },
      dto: {
        'received.name': contact.name,
        'received.avatar': contact.avatar,
        'received.profileColor': contact.profileColor,
        'received.isContact': true,
        'received.contactName': contact.name,
        'received.contactProfileColor': contact.profileColor,
        'received.contactAvatar': contact.avatar,
      },
    });
  }

  private async removeContactFromSpaces(contactUserId: string) {
    const contactObjectId = new Types.ObjectId(contactUserId);

    const userData = await this.usersRepository.findOne({
      query: { _id: contactUserId },
      select: 'name avatar profileColor username',
    });

    await this.spacesRepository.updateMany({
      query: { 'sender._id': contactObjectId },
      dto: {
        'sender.isContact': false,
        'sender.name': userData.name,
        'sender.avatar': userData.avatar,
        'sender.profileColor': userData.profileColor,
        'sender.contactName': null,
        'sender.contactProfileColor': null,
        'sender.contactAvatar': null,
      },
    });

    await this.spacesRepository.updateMany({
      query: { 'received._id': contactObjectId },
      dto: {
        'received.isContact': false,
        'received.name': userData.name,
        'received.avatar': userData.avatar,
        'received.profileColor': userData.profileColor,
        'received.contactName': null,
        'received.contactProfileColor': null,
        'received.contactAvatar': null,
      },
    });
  }
}
