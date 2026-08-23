import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SystemIssuesRepository } from '../../../../../../common/modules/platform/reports/repositories/system-issues.repository';

@Injectable()
export class AssignSystemIssueService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async assign({
    issueId,
    adminId,
  }: {
    issueId: string;
    adminId: string;
  }) {
    const issue = await this.systemIssuesRepository.findOne({
      query: { _id: new Types.ObjectId(issueId) },
    });

    if (!issue) throw new NotFoundException('issues.notFound');

    const updated = await this.systemIssuesRepository.updateOne({
      query: { _id: new Types.ObjectId(issueId) },
      dto: {
        assignedTo: new Types.ObjectId(adminId),
      },
    });

    if (!updated) throw new NotFoundException('issues.notFound');
    return updated;
  }
}
