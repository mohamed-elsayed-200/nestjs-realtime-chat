import { InjectModel } from '@nestjs/mongoose';
import { Call } from './schemas/call.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { CreateOneProps, FindOneProps } from '../../../types/interfaces';

@Injectable()
export class CallsRepository {
  constructor(
    @InjectModel(Call.name) private readonly callModel: Model<Call>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.callModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.callModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto, populate }: CreateOneProps) {
    if (dto.caller) dto.caller = new Types.ObjectId(dto.caller);
    if (dto.receiver) dto.receiver = new Types.ObjectId(dto.receiver);
    if (dto.space) dto.space = new Types.ObjectId(dto.space);
    if (dto.createdBy) dto.createdBy = new Types.ObjectId(dto.createdBy);
    if (dto.endedBy) dto.endedBy = new Types.ObjectId(dto.endedBy);
    let query = this.callModel.create(dto);

    const doc = await query;

    if (populate?.length) {
      await doc.populate(populate);
    }

    return doc;
  }

  public async updateOne({ query, dto }) {
    if (dto.caller) dto.caller = new Types.ObjectId(dto.caller);
    if (dto.receiver) dto.receiver = new Types.ObjectId(dto.receiver);
    if (dto.space) dto.space = new Types.ObjectId(dto.space);
    if (dto.createdBy) dto.createdBy = new Types.ObjectId(dto.createdBy);
    if (dto.endedBy) dto.endedBy = new Types.ObjectId(dto.endedBy);
    return this.callModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.callModel.findOneAndDelete(query);
  }
}
