import { InjectModel } from '@nestjs/mongoose';
import { Space } from './schemas/space.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindOneProps } from '../../../types/interfaces';

@Injectable()
export class SpacesRepository {
  constructor(
    @InjectModel(Space.name) private readonly spaceModel: Model<Space>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.spaceModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.spaceModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto }) {
    if (dto?.createdBy) dto.createdBy = new Types.ObjectId(dto?.createdBy);
    return this.spaceModel.create(dto);
  }

  public async updateOne({ query, dto }) {
    if (dto?.createdBy) dto.createdBy = new Types.ObjectId(dto?.createdBy);
    return this.spaceModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.spaceModel.findOneAndDelete(query);
  }
}
