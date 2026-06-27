import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { DeletedMessage } from '../schemas/deleted-message.schema';

@Injectable()
export class DeletedMessagesRepository {
  constructor(
    @InjectModel(DeletedMessage.name)
    private readonly deletedMessageModel: Model<DeletedMessage>,
  ) {}

  public async findMany({ query, select }: { query: any; select?: string }) {
    let base = this.deletedMessageModel.find(query);
    if (select) base.select(select);
    return await base.lean().exec();
  }

  public async findOne({ query }: { query: any }) {
    return await this.deletedMessageModel.findOne(query).lean().exec();
  }

  public async upsertOne({ query, dto }: { query: any; dto: any }) {
    return this.deletedMessageModel.findOneAndUpdate(
      query,
      { $setOnInsert: dto },
      { upsert: true, new: true },
    );
  }

  public async deleteMany({ query }: { query: any }) {
    return this.deletedMessageModel.deleteMany(query);
  }
}
