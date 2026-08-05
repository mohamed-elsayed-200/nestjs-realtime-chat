import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindOneProps } from '../../../types/interfaces';
import { View } from './view.schema';

@Injectable()
export class ViewsRepository {
  constructor(
    @InjectModel(View.name) private readonly viewModel: Model<View>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.viewModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select, sort }: FindOneProps) {
    const base = this.viewModel.findOne(query);
    if (select) base.select(select);
    if (sort) base.sort(sort);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto }) {
    if (dto.target) dto.target = new Types.ObjectId(dto.target);
    if (dto.user) dto.user = new Types.ObjectId(dto.user);
    const newView = await this.viewModel.create(dto);
    return newView;
  }

  public async deleteOne({ query }) {
    return this.viewModel.findOneAndDelete(query);
  }

  public async deleteMany({ query }) {
    return this.viewModel.deleteMany(query);
  }
}
