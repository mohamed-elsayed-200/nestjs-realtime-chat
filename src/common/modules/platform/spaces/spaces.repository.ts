import { InjectModel } from '@nestjs/mongoose';
import { Space } from './schemas/space.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindOneProps } from '../../../types/interfaces';
import { JoinApproval } from '../../../types/enums';

@Injectable()
export class SpacesRepository {
  constructor(
    @InjectModel(Space.name) private readonly spaceModel: Model<Space>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.spaceModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.spaceModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async findLean({ query, populate, select }: FindOneProps) {
    const base = this.spaceModel.find(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async count({ query }) {
    return this.spaceModel.countDocuments(query);
  }

  public async createOne({ dto }) {
    if (dto?.createdBy) dto.createdBy = new Types.ObjectId(dto?.createdBy);
    if (dto?.parentSpace)
      dto.parentSpace = new Types.ObjectId(dto?.parentSpace);
    if (dto?.received) dto.received = new Types.ObjectId(dto?.received);
    if (dto?.sender) dto.sender = new Types.ObjectId(dto?.sender);
    if (dto?.receivedContact)
      dto.receivedContact = new Types.ObjectId(dto?.receivedContact);
    if (dto?.senderContact)
      dto.senderContact = new Types.ObjectId(dto?.senderContact);
    if (dto?.lastMessage)
      dto.lastMessage = new Types.ObjectId(dto?.lastMessage);
    return this.spaceModel.create(dto);
  }

  public async updateOne({ query, dto }) {
    if (dto?.createdBy) dto.createdBy = new Types.ObjectId(dto?.createdBy);
    if (dto?.parentSpace)
      dto.parentSpace = new Types.ObjectId(dto?.parentSpace);
    if (dto?.received) dto.received = new Types.ObjectId(dto?.received);
    if (dto?.sender) dto.sender = new Types.ObjectId(dto?.sender);
    if (dto?.receivedContact)
      dto.receivedContact = new Types.ObjectId(dto?.receivedContact);
    if (dto?.senderContact)
      dto.senderContact = new Types.ObjectId(dto?.senderContact);
    if (dto?.lastMessage)
      dto.lastMessage = new Types.ObjectId(dto?.lastMessage);
    return this.spaceModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.spaceModel.findOneAndDelete(query);
  }

  public async updateMany({ query, dto }) {
    if (dto?.createdBy) dto.createdBy = new Types.ObjectId(dto?.createdBy);
    await this.spaceModel.updateMany(query, { $set: dto });
    return this.spaceModel.find(query).lean().exec();
  }

  public async bulkUpdate({ operations }) {
    const bulkOps = operations.map((op) => ({
      updateOne: {
        filter: op.filter,
        update: { $set: op.update },
      },
    }));

    return this.spaceModel.bulkWrite(bulkOps);
  }
}
