import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindOneProps } from '../../../types/interfaces';
import { JoinRequest } from './join-request.schema';

@Injectable()
export class JoinRequestsRepository {
  constructor(
    @InjectModel(JoinRequest.name)
    private readonly joinRequestModel: Model<JoinRequest>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.joinRequestModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.joinRequestModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto }) {
    if (dto?.user) dto.user = new Types.ObjectId(dto?.user);
    if (dto?.space) dto.space = new Types.ObjectId(dto?.space);
    if (dto?.reviewedBy) dto.reviewedBy = new Types.ObjectId(dto?.reviewedBy);

    return this.joinRequestModel.create(dto);
  }

  public async updateOne({ query, dto }) {
    if (dto?.user) dto.user = new Types.ObjectId(dto?.user);
    if (dto?.space) dto.space = new Types.ObjectId(dto?.space);
    if (dto?.reviewedBy) dto.reviewedBy = new Types.ObjectId(dto?.reviewedBy);

    return this.joinRequestModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.joinRequestModel.findOneAndDelete(query);
  }

  public async updateMany({ query, dto }) {
    if (dto?.user) dto.user = new Types.ObjectId(dto?.user);
    if (dto?.space) dto.space = new Types.ObjectId(dto?.space);
    if (dto?.reviewedBy) dto.reviewedBy = new Types.ObjectId(dto?.reviewedBy);

    await this.joinRequestModel.updateMany(query, { $set: dto });
    return this.joinRequestModel.find(query).lean().exec();
  }
}
