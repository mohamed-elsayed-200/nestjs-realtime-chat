import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Permission } from './permission.schema';
import { Model } from 'mongoose';
import { FindOneProps } from '../../../types/interfaces';
import { aggregateQuery } from '../../data-access/aggregate-query';

@Injectable()
export class PermissionsRepository {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDescriptor>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      options: {
        model: this.permissionModel,
        ...options,
      },
      query,
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const item = this.permissionModel.findOne(query);
    if (populate) item.populate(populate);
    if (select) item.select(select);
    const permission = await item;
    return permission;
  }
}
