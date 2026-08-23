import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SystemIssuesRepository } from '../../../../../../common/modules/platform/reports/repositories/system-issues.repository';
import { IssueStatus } from '../../../../../../common/types/enums';

export interface UpdateIssueStatusDto {
  status: IssueStatus;
  resolutionNotes?: string;
}

@Injectable()
export class UpdateSystemIssueStatusService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async update({
    issueId,
    dto,
    adminId,
  }: {
    issueId: string;
    dto: UpdateIssueStatusDto;
    adminId: string;
  }) {
    const issue = await this.systemIssuesRepository.findOne({
      query: { _id: new Types.ObjectId(issueId) },
    });

    if (!issue) throw new NotFoundException('issues.notFound');

    const updatePayload: any = {
      status: dto.status,
      resolutionNotes: dto.resolutionNotes,
    };

    if (dto.status === IssueStatus.IN_PROGRESS && !issue.assignedTo) {
      updatePayload.assignedTo = new Types.ObjectId(adminId);
    }

    if (dto.status === IssueStatus.RESOLVED) {
      updatePayload.resolvedAt = new Date();
    }

    if (dto.status === IssueStatus.CLOSED) {
      updatePayload.closedAt = new Date();
    }

    if (
      issue.status === IssueStatus.RESOLVED &&
      dto.status === IssueStatus.OPEN
    ) {
      updatePayload.reopenCount = (issue.reopenCount || 0) + 1;
    }

    const updated = await this.systemIssuesRepository.updateOne({
      query: { _id: new Types.ObjectId(issueId) },
      dto: updatePayload,
    });

    if (!updated) throw new NotFoundException('issues.notFound');
    return updated;
  }
}
