import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import {
  CreateOneProps,
  FindManyProps,
  FindOneProps,
  UpdateOneProps,
} from '../../../types/interfaces';
import { Participant } from './schemas/participant.schema';

const USER_POPULATE = [
  { path: 'user', select: 'name avatar profileColor bio' },
];

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
    base.populate(populate ?? USER_POPULATE);
    return await base.lean({ virtuals: true }).exec();
  }

  public async findMany({ query, populate }: FindManyProps) {
    return this.participantModel
      .find(query)
      .populate(populate ?? USER_POPULATE)
      .lean({ virtuals: true })
      .exec();
  }

  public async createOne({ dto, populate }: CreateOneProps) {
    if (dto?.call) dto.call = new Types.ObjectId(dto.call);
    if (dto?.user) dto.user = new Types.ObjectId(dto.user);
    if (dto?.member) dto.member = new Types.ObjectId(dto.member);
    if (dto?.space) dto.space = new Types.ObjectId(dto.space);

    const doc = await this.participantModel.create(dto);
    await doc.populate(populate ?? USER_POPULATE);

    return doc.toObject({ virtuals: true });
  }

  public async updateOne({ query, dto, populate }: UpdateOneProps) {
    if (dto?.call) dto.call = new Types.ObjectId(dto.call);
    if (dto?.user) dto.user = new Types.ObjectId(dto.user);
    if (dto?.member) dto.member = new Types.ObjectId(dto.member);
    if (dto?.space) dto.space = new Types.ObjectId(dto.space);

    return this.participantModel
      .findOneAndUpdate(query, dto, { new: true })
      .populate(populate ?? USER_POPULATE)
      .lean({ virtuals: true })
      .exec();
  }

  public async updateMany({ query, dto }) {
    if (dto?.user) dto.user = new Types.ObjectId(dto?.user);
    if (dto?.space) dto.space = new Types.ObjectId(dto?.space);
    if (dto?.reviewedBy) dto.reviewedBy = new Types.ObjectId(dto?.reviewedBy);

    await this.participantModel.updateMany(query, { $set: dto });
    return this.participantModel.find(query).lean().exec();
  }

  public async deleteOne({ query }) {
    return this.participantModel.findOneAndDelete(query);
  }
}
