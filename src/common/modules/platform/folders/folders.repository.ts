import { InjectModel } from '@nestjs/mongoose';
import { Folder } from './folder.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../data-access/aggregate-query';
import { CreateOneProps, FindOneProps } from '../../../types/interfaces';

@Injectable()
export class FoldersRepository {
  constructor(
    @InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.folderModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.folderModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto, populate }: CreateOneProps) {
    if (dto?.user) dto.user = new Types.ObjectId(dto.user);
    let query = this.folderModel.create(dto);

    const doc = await query;

    if (populate?.length) {
      await doc.populate(populate);
    }

    return doc;
  }

  public async updateOne({ query, dto }) {
    if (dto?.user) dto.user = new Types.ObjectId(dto?.user);
    return this.folderModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.folderModel.findOneAndDelete(query);
  }
}
