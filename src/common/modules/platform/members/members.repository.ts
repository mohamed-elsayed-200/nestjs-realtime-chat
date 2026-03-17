import { InjectModel } from '@nestjs/mongoose';
import { Member } from './member.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindOneProps } from '../../../types/interfaces';

@Injectable()
export class MembersRepository {
  constructor(
    @InjectModel(Member.name) private readonly chatModel: Model<Member>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.chatModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.chatModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto }) {
    if (dto?.space) dto.space = new Types.ObjectId(dto?.space);
    if (dto?.user) dto.user = new Types.ObjectId(dto?.user);
    return this.chatModel.create(dto);
  }

  public async updateOne({ query, dto }) {
    if (dto?.space) dto.space = new Types.ObjectId(dto?.space);
    if (dto?.user) dto.user = new Types.ObjectId(dto?.user);
    return this.chatModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.chatModel.findOneAndDelete(query);
  }
}
