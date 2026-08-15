import { InjectModel } from '@nestjs/mongoose';
import { Banned } from './banned.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';

@Injectable()
export class BannedRepository {
  constructor(
    @InjectModel(Banned.name) private readonly bannedModel: Model<Banned>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.bannedModel,
        ...options,
      },
    });
  }

  public async createOne({ dto }) {
    return await this.bannedModel.create({
      bannedBy: new Types.ObjectId(dto.bannedBy),
      bannedUser: new Types.ObjectId(dto.bannedUser),
    });
  }

  public async deleteOne({ query }) {
    return this.bannedModel.findOneAndDelete({
      bannedBy: new Types.ObjectId(query.bannedBy),
      bannedUser: new Types.ObjectId(query.bannedUser),
    });
  }

  public async findEitherDirection({ userA, userB }) {
    return this.bannedModel.findOne({
      $or: [
        {
          bannedBy: new Types.ObjectId(userA),
          bannedUser: new Types.ObjectId(userB),
        },
        {
          bannedBy: new Types.ObjectId(userB),
          bannedUser: new Types.ObjectId(userA),
        },
      ],
    });
  }
}
