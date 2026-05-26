import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { Types } from 'mongoose';

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}
  public async getAll({ query, spaceId, authUser }) {
    console.log(spaceId);

    return this.messagesRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['text'],
        pipelines: [
          {
            $match: {
              space: new Types.ObjectId(spaceId),
            },
          },
          {
            $sort: { createdAt: -1 },
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
              space: 1,
              sender: 1,
              text: 1,
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

    return message;
  }

  public async update({ messageId, dto, authUser }) {
    const message = await this.messagesRepository.updateOne({
      query: { _id: messageId, sender: authUser?._id },
      dto: { ...dto, isEdited: true },
    });
    if (!message) throw new NotFoundException('messages.notUpdated');

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
