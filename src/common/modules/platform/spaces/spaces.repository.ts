import { InjectModel } from '@nestjs/mongoose';
import { Space } from './space.schema';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindOneProps } from '../../../types/interfaces';

@Injectable()
export class SpacesRepository {
  constructor(
    @InjectModel(Space.name) private readonly chatModel: Model<Space>,
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
    return this.chatModel.create(dto);
  }

  public async updateOne({ query, dto }) {
    return this.chatModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.chatModel.findOneAndDelete(query);
  }
}
