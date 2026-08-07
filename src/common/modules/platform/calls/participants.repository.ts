import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { CreateOneProps, FindOneProps } from '../../../types/interfaces';
import { Participant } from './schemas/participant.schema';

@Injectable()
export class ParticipantsRepository {
  constructor(
    @InjectModel(Participant.name)
    private readonly participantModel: Model<Participant>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.participantModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.participantModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto, populate }: CreateOneProps) {
    if (dto?.call) dto.call = new Types.ObjectId(dto.call);
    if (dto?.user) dto.user = new Types.ObjectId(dto.user);
    if (dto?.member) dto.member = new Types.ObjectId(dto.member);
    if (dto?.space) dto.space = new Types.ObjectId(dto.space);
    let query = this.participantModel.create(dto);

    const doc = await query;

    if (populate?.length) {
      await doc.populate(populate);
    }

    return doc;
  }

  public async updateOne({ query, dto }) {
    if (dto?.call) dto.call = new Types.ObjectId(dto.call);
    if (dto?.user) dto.user = new Types.ObjectId(dto.user);
    if (dto?.member) dto.member = new Types.ObjectId(dto.member);
    if (dto?.space) dto.space = new Types.ObjectId(dto.space);
    return this.participantModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.participantModel.findOneAndDelete(query);
  }
}
