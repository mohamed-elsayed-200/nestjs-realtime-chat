import { InjectModel } from '@nestjs/mongoose';
import { Message } from './message.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindOneProps } from '../../../types/interfaces';

@Injectable()
export class MessagesRepository {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.messageModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.messageModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto }) {
    if (dto.space) dto.space = new Types.ObjectId(dto.space);
    if (dto.sender) dto.sender = new Types.ObjectId(dto.sender);
    if (dto.replyTo) dto.replyTo = new Types.ObjectId(dto.replyTo);

    const newMsg = (await this.messageModel.create(dto)).populate([
      {
        path: 'replyTo',
        model: 'Message',
        populate: [
          {
            path: 'sender',
            select: 'name profileColor',
          },
        ],
      },
    ]);
    return newMsg;
  }

  public async updateOne({ query, dto }) {
    if (dto.space) dto.space = new Types.ObjectId(dto.space);
    if (dto.sender) dto.sender = new Types.ObjectId(dto.sender);
    if (dto.replyTo) dto.replyTo = new Types.ObjectId(dto.replyTo);
    return this.messageModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.messageModel.findOneAndDelete(query);
  }
}
