import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  public async getAll({ query, authUser, chatId }) {
    return this.messagesRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name', 'description'],
        allowedFilterFields: ['status'],
        pipelines: [
          {
            $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: 'message',
              as: 'getProducts',
            },
          },
          {
            $project: {
              name: 1,
              thumbnail: 1,
              description: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              products: { $size: '$getProducts' },
            },
          },
        ],
      },
    });
  }

  public async getOne({ messageId }) {
    const message = await this.messagesRepository.findOne({
      query: { _id: messageId },
    });

    if (!message) throw new NotFoundException('messages.notFound');

    return message;
  }

  public async create({ dto }) {
    const message = await this.messagesRepository.createOne({ dto });

    if (!message) throw new InternalServerErrorException('messages.notCreated');

    return message;
  }

  public async update({ messageId, dto }) {
    const message = await this.messagesRepository.updateOne({
      query: { _id: messageId },
      dto,
    });
    if (!message) throw new NotFoundException('messages.notUpdated');

    return message;
  }

  public async delete({ messageId }) {
    const item = await this.messagesRepository.deleteOne({
      query: { _id: messageId },
    });

    if (!item) throw new NotFoundException('messages.notDeleted');

    return item;
  }
}
