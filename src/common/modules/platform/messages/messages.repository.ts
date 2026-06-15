import { InjectModel } from '@nestjs/mongoose';
import { Message } from './message.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindManyProps, FindOneProps } from '../../../types/interfaces';

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

  public async findMany({ query, sort }: FindManyProps) {
    let base = this.messageModel.find(query);
    if (sort) base.sort(sort);
    return await base.lean().exec();
  }

  public async findOne({ query, populate, select, sort }: FindOneProps) {
    const base = this.messageModel.findOne(query);
    if (select) base.select(select);
    if (sort) base.sort(sort);
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
  async insertMany({ documents }: { documents: any[] }) {
    return this.messageModel.insertMany(documents);
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

  public async deleteMany({ query }) {
    return this.messageModel.deleteMany(query);
  }
}
