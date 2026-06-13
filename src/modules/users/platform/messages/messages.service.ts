import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { MessagesRepository } from '../../../../common/modules/platform/messages/messages.repository';
import { SpacesRepository } from '../../../../common/modules/platform/spaces/spaces.repository';
import { MessageStatus } from '../../../../common/types/enums';

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
              isOutgoing: {
                $cond: {
                  if: {
                    $eq: ['$sender._id', new Types.ObjectId(authUser?._id)],
                  },
                  then: true,
                  else: false,
                },
              },
              space: 1,
              sender: {
                profileColor: '$send.profileColor',
                avatar: '$send.avatar',
                name: '$send.name',
                _id: '$sender._id',
              },
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
    return {
      ...message,
      isOutgoing: message.sender?.toString() === authUser?._id?.toString(),
    };
  }

  public async create({ dto, authUser }) {
    const message = await this.messagesRepository.createOne({
      dto: { ...dto, sender: new Types.ObjectId(authUser?._id) },
    });

    if (!message) throw new InternalServerErrorException('messages.notCreated');

    await this.spacesRepository.updateOne({
      query: { _id: new Types.ObjectId(message.space?.toString()) },
      dto: {
        lastMessage: {
          _id: new Types.ObjectId(message?._id),
          text: message?.text,
          sender: message?.sender,
          status: MessageStatus.SENT,
          createdAt: new Date(),
        },
      },
    });
    return {
      ...message.toObject(),
      isOutgoing: message.sender?.toString() === authUser?._id?.toString(),
    };
  }

  public async update({ messageId, dto, authUser }) {
    const message = await this.messagesRepository.updateOne({
      query: { _id: messageId, sender: authUser?._id },
      dto: { ...dto, isEdited: true },
    });
    if (!message) throw new NotFoundException('messages.notUpdated');

    await this.spacesRepository.updateOne({
      query: { _id: message.space },
      dto: {
        lastMessage: {
          _id: new Types.ObjectId(message?._id),
          text: message?.text,
          sender: message?.sender,
          status: message?.status,
          isEdited: true,
          createdAt: new Date(),
        },
      },
    });

    return {
      ...message.toObject(),
      isOutgoing: message.sender?.toString() === authUser?._id?.toString(),
    };
  }

  public async delete({ messageId, authUser }) {
    const message = await this.messagesRepository.deleteOne({
      query: { _id: messageId, sender: authUser?._id },
    });

    if (!message) throw new NotFoundException('messages.notDeleted');

    return {
      ...message.toObject(),
      isOutgoing: message.sender?.toString() === authUser?._id?.toString(),
    };
  }
}
