import { InjectModel } from '@nestjs/mongoose';
import { SystemIssue } from '../schemas/system-issue.schema';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { aggregateQuery } from '../../../data-access/aggregate-query';
import { FindOneProps } from '../../../../types/interfaces';

@Injectable()
export class SystemIssuesRepository {
  constructor(
    @InjectModel(SystemIssue.name)
    private readonly systemIssueModel: Model<SystemIssue>,
  ) {}

  public async findAll({ query, options }) {
    return aggregateQuery({
      query,
      options: {
        model: this.systemIssueModel,
        ...options,
      },
    });
  }

  public async findOne({ query, populate, select }: FindOneProps) {
    const base = this.systemIssueModel.findOne(query);
    if (select) base.select(select);
    if (populate) base.populate(populate);
    return await base.lean().exec();
  }

  public async createOne({ dto }) {
    if (dto.reportedBy) dto.reportedBy = new Types.ObjectId(dto.reportedBy);
    if (dto.assignedTo) dto.assignedTo = new Types.ObjectId(dto.assignedTo);
    return this.systemIssueModel.create(dto);
  }

  public async updateOne({ query, dto }) {
    if (dto.reportedBy) dto.reportedBy = new Types.ObjectId(dto.reportedBy);
    if (dto.assignedTo) dto.assignedTo = new Types.ObjectId(dto.assignedTo);
    return this.systemIssueModel.findOneAndUpdate(query, dto, { new: true });
  }

  public async deleteOne({ query }) {
    return this.systemIssueModel.findOneAndDelete(query);
  }

  public async deleteMany({ query }) {
    return this.systemIssueModel.deleteMany(query);
  }

  public async count({ query }: { query: any }): Promise<number> {
    return this.systemIssueModel.countDocuments(query).exec();
  }
}
