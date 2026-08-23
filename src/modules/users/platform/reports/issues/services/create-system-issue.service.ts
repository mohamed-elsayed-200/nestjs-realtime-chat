import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SystemIssuesRepository } from '../../../../../../common/modules/platform/reports/repositories/system-issues.repository';
import { IssueStatus } from '../../../../../../common/types/enums';

@Injectable()
export class CreateSystemIssueService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async create({ dto, authUser }) {
    // Check if user already has an open issue with the same title
    const existingIssue = await this.systemIssuesRepository.findOne({
      query: {
        reportedBy: new Types.ObjectId(authUser._id),
        title: dto.title,
        status: { $in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] },
      },
    });

    // If exists, return it without creating a new one
    if (existingIssue) {
      return existingIssue;
    }

    const issue = await this.systemIssuesRepository.createOne({
      dto: {
        ...dto,
        reportedBy: authUser._id,
        status: IssueStatus.OPEN,
      },
    });

    if (!issue) throw new InternalServerErrorException('issues.notCreated');
    return issue;
  }
}