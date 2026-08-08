import { InjectModel } from '@nestjs/mongoose';
import { Call } from './schemas/call.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import {
  CreateOneProps,
  FindOneProps,
  UpdateOneProps,
} from '../../../types/interfaces';

const CALLER_RECEIVER_POPULATE = [
  { path: 'caller', select: 'name avatar profileColor' },
  { path: 'receiver', select: 'name avatar profileColor' },
  { path: 'space', select: 'name avatar profileColor type' },
];

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
    base.populate(populate ?? CALLER_RECEIVER_POPULATE);
    return await base.lean({ virtuals: true }).exec();
  }

  public async createOne({ dto, populate }: CreateOneProps) {
    if (dto.caller) dto.caller = new Types.ObjectId(dto.caller);
    if (dto.receiver) dto.receiver = new Types.ObjectId(dto.receiver);
    if (dto.space) dto.space = new Types.ObjectId(dto.space);
    if (dto.createdBy) dto.createdBy = new Types.ObjectId(dto.createdBy);
    if (dto.endedBy) dto.endedBy = new Types.ObjectId(dto.endedBy);

    const doc = await this.callModel.create(dto);
    await doc.populate(populate ?? CALLER_RECEIVER_POPULATE);

    return doc.toObject({ virtuals: true });
  }

  public async updateOne({ query, dto, populate }: UpdateOneProps) {
    if (dto.caller) dto.caller = new Types.ObjectId(dto.caller);
    if (dto.receiver) dto.receiver = new Types.ObjectId(dto.receiver);
    if (dto.space) dto.space = new Types.ObjectId(dto.space);
    if (dto.createdBy) dto.createdBy = new Types.ObjectId(dto.createdBy);
    if (dto.endedBy) dto.endedBy = new Types.ObjectId(dto.endedBy);

    return this.callModel
      .findOneAndUpdate(query, dto, { new: true })
      .populate(populate ?? CALLER_RECEIVER_POPULATE)
      .lean({ virtuals: true })
      .exec();
  }

  public async deleteOne({ query }) {
    return this.callModel.findOneAndDelete(query);
  }
}
