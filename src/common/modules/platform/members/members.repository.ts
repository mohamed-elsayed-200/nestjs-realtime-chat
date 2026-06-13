import { InjectModel } from '@nestjs/mongoose';
import { Member } from './member.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { CreateOneProps, FindOneProps } from '../../../types/interfaces';

@Injectable()
export class MembersRepository {
  constructor(
    @InjectModel(Member.name) private readonly memberModel: Model<Member>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.memberModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.memberModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto, populate }: CreateOneProps) {
    if (dto?.space) dto.space = new Types.ObjectId(dto.space);
    if (dto?.user) dto.user = new Types.ObjectId(dto.user);

    let query = this.memberModel.create(dto);

    const doc = await query;

    if (populate?.length) {
      await doc.populate(populate);
    }

    return doc;
  }

  public async updateOne({ query, dto }) {
    if (dto?.space) dto.space = new Types.ObjectId(dto?.space);
    if (dto?.user) dto.user = new Types.ObjectId(dto?.user);
    return this.memberModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async markUnreadCountAsRead({ spaceId, authUser }) {
    const userId = new Types.ObjectId(authUser?._id);
    await this.updateOne({
      query: {
        space: new Types.ObjectId(spaceId),
        user: new Types.ObjectId(userId),
      },
      dto: {
        unreadCount: 0,
      },
    });
  }

  public async updateMany({ query, dto }) {
    if (dto?.space) dto.space = new Types.ObjectId(dto?.space);
    if (dto?.user) dto.user = new Types.ObjectId(dto?.user);

    return this.memberModel.updateMany(query, dto);
  }

  public async deleteOne({ query }) {
    return this.memberModel.findOneAndDelete(query);
  }
  public async deleteMany({ query }) {
    return this.memberModel.deleteMany(query);
  }
}
