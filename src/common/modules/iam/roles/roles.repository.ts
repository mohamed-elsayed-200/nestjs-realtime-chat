import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from './role.schema';
import { Model, Types } from 'mongoose';
import { FindOneProps } from '../../../types/interfaces';
import { aggregateQuery } from '../../data-access/aggregate-query';

@Injectable()
export class RolesRepository {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      options: {
        model: this.roleModel,
        ...options,
      },
      query,
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const item = this.roleModel.findOne(query);
    if (populate) item.populate(populate);
    if (select) item.populate(select);
    const result = await item;
    return result;
  }

  public async createOne({ dto }) {
    return this.roleModel.create(dto);
  }

  public async updateOne({ query, dto }) {
    return this.roleModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.roleModel.findOneAndDelete(query, { new: true });
  }
}
