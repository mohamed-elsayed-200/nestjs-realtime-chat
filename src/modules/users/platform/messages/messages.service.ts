import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly spacesRepository: SpacesRepository,
  ) {}
  public async getAll({ query, spaceId, authUser }) {
    return this.messagesRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['text'],
        sort: { createdAt: 1 },
        pipelines: [
          {
            $match: {
              space: new Types.ObjectId(spaceId),
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'sender',
              foreignField: '_id',
              as: 'sender',
            },
          },
          {
            $unwind: {
              path: '$sender',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'messages',
              localField: 'replyTo',
              foreignField: '_id',
              as: 'replyTo',
            },
          },
          {
            $unwind: {
              path: '$replyTo',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'replyTo.sender',
              foreignField: '_id',
              as: 'replyTo.sender',
            },
          },
          {
            $unwind: {
              path: '$replyTo.sender',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              isOutgoing: 1,
              space: 1,
              sender: 1,
              text: 1,
              content: 1,
              messageType: 1,
              metadata: 1,
              mediaUrl: 1,
              replyTo: 1,
              status: 1,
              createdAt: 1,
            },
          },
        ],
      },
    });
  }

  public async getOne({ messageId, authUser }) {
    const message = await this.messagesRepository.findOne({
      query: { _id: messageId },
    });

    if (!message) throw new NotFoundException('messages.notFound');

    return message;
  }

  public async create({ dto, authUser }) {
    const message = await this.messagesRepository.createOne({
      dto: { ...dto, sender: new Types.ObjectId(authUser?._id) },
    });

    if (!message) throw new InternalServerErrorException('messages.notCreated');

    await this.spacesRepository.updateOne({
      query: { _id: message.space },
      dto: { lastMessage: message._id },
    });

    return message;
  }

  public async update({ messageId, dto, authUser }) {
    const message = await this.messagesRepository.updateOne({
      query: { _id: messageId, sender: authUser?._id },
      dto: { ...dto, isEdited: true },
    });
    if (!message) throw new NotFoundException('messages.notUpdated');

    await this.spacesRepository.updateOne({
      query: { _id: message.space },
      dto: { lastMessage: message._id },
    });

    return message;
  }

  public async delete({ messageId, authUser }) {
    const item = await this.messagesRepository.deleteOne({
      query: { _id: messageId, sender: authUser?._id },
    });

    if (!item) throw new NotFoundException('messages.notDeleted');

    return item;
  }
}
