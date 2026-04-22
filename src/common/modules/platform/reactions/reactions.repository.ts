import { InjectModel } from '@nestjs/mongoose';
import { Reaction } from './reaction.schema';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindOneProps } from '../../../types/interfaces';
import { Types } from 'mongoose';

@Injectable()
export class ReactionsRepository {
  constructor(
    @InjectModel(Reaction.name) private readonly reactionModel: Model<Reaction>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.reactionModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.reactionModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto }) {
    if (dto.message) dto.message = new Types.ObjectId(dto.message);
    if (dto.user) dto.user = new Types.ObjectId(dto.user);
    return this.reactionModel.create(dto);
  }

  public async updateOne({ query, dto }) {
    if (dto.message) dto.message = new Types.ObjectId(dto.message);
    if (dto.user) dto.user = new Types.ObjectId(dto.user);
    return this.reactionModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.reactionModel.findOneAndDelete(query);
  }
}
