import { InjectModel } from '@nestjs/mongoose';
import { Banned } from './banned.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindOneProps } from '../../../../common/types/interfaces';

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

  public async findOne({ query, populate, select, sort }: FindOneProps) {
    const base = this.bannedModel.findOne(query);
    if (select) base.select(select);
    if (sort) base.sort(sort);
    if (populate) base.populate(populate);
    return await base.lean().exec();
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

  public async findBothDirections({ userA, userB }) {
    const [iBlockedThem, theyBlockedMe] = await Promise.all([
      this.bannedModel
        .findOne({
          bannedBy: new Types.ObjectId(userA),
          bannedUser: new Types.ObjectId(userB),
        })
        .lean(),
      this.bannedModel
        .findOne({
          bannedBy: new Types.ObjectId(userB),
          bannedUser: new Types.ObjectId(userA),
        })
        .lean(),
    ]);

    return { iBlockedThem, theyBlockedMe };
  }
}
