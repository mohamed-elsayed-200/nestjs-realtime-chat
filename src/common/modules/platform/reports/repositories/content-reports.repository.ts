import { InjectModel } from '@nestjs/mongoose';
import { ContentReport } from '../schemas/content-report.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../../data-access/aggregate-query';
import { FindOneProps } from '../../../../types/interfaces';

@Injectable()
export class ContentReportsRepository {
  constructor(
    @InjectModel(ContentReport.name)
    private readonly contentReportModel: Model<ContentReport>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.contentReportModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.contentReportModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto }) {
    if (dto.reporter) dto.reporter = new Types.ObjectId(dto.reporter);
    if (dto.targetId) dto.targetId = new Types.ObjectId(dto.targetId);
    if (dto.resolvedBy) dto.resolvedBy = new Types.ObjectId(dto.resolvedBy);
    return this.contentReportModel.create(dto);
  }

  public async updateOne({ query, dto }) {
    if (dto.reporter) dto.reporter = new Types.ObjectId(dto.reporter);
    if (dto.targetId) dto.targetId = new Types.ObjectId(dto.targetId);
    if (dto.resolvedBy) dto.resolvedBy = new Types.ObjectId(dto.resolvedBy);
    return this.contentReportModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.contentReportModel.findOneAndDelete(query);
  }

  public async deleteMany({ query }) {
    return this.contentReportModel.deleteMany(query);
  }

  public async count({ query }: { query: any }): Promise<number> {
    return this.contentReportModel.countDocuments(query).exec();
  }
}
