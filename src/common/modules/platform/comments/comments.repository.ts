import { InjectModel } from '@nestjs/mongoose';
import { Comment } from './comment.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { FindOneProps } from '../../../types/interfaces';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.commentModel,
        ...options,
      },
    });
  }

  public async findMany({ query, populate, select, sort }: FindOneProps) {
    const base = this.commentModel.find(query);
    if (select) base.select(select);
    if (sort) base.sort(sort);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }
  public async findOne({ query, populate, select, sort }: FindOneProps) {
    const base = this.commentModel.findOne(query);
    if (select) base.select(select);
    if (sort) base.sort(sort);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto }) {
    if (dto.message) dto.message = new Types.ObjectId(dto.message);
    if (dto.space) dto.space = new Types.ObjectId(dto.space);
    if (dto.parent) dto.parent = new Types.ObjectId(dto.parent);
    if (dto.author) dto.author = new Types.ObjectId(dto.author);

    const comment = await this.commentModel.create(dto);
    return comment;
  }

  public async updateOne({ query, dto }) {
    if (dto.message) dto.message = new Types.ObjectId(dto.message);
    if (dto.space) dto.space = new Types.ObjectId(dto.space);
    if (dto.parent) dto.parent = new Types.ObjectId(dto.parent);
    if (dto.author) dto.author = new Types.ObjectId(dto.author);
    return this.commentModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.commentModel.findOneAndDelete(query);
  }

  public async deleteMany({ query }) {
    return this.commentModel.deleteMany(query);
  }
}
