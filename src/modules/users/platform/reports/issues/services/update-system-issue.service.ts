import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SystemIssuesRepository } from '../../../../../../common/modules/platform/reports/repositories/system-issues.repository';
import { IssueStatus } from '../../../../../../common/types/enums';
import { UpdateSystemIssueDto } from '../dto/update-system-issue.dto';

@Injectable()
export class UpdateSystemIssueService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async update({
    issueId,
    dto,
    authUser,
  }: {
    issueId: string;
    dto: UpdateSystemIssueDto;
    authUser: any;
  }) {
    const issue = await this.systemIssuesRepository.findOne({
      query: { _id: new Types.ObjectId(issueId) },
    });

    if (!issue) throw new NotFoundException('issues.notFound');

    if (issue.reportedBy?.toString() !== authUser._id.toString()) {
      throw new ForbiddenException('issues.forbidden');
    }

    if (
      issue.status !== IssueStatus.OPEN &&
      issue.status !== IssueStatus.IN_PROGRESS
    ) {
      throw new BadRequestException('issues.cannotUpdateResolved');
    }

    const updated = await this.systemIssuesRepository.updateOne({
      query: { _id: new Types.ObjectId(issueId) },
      dto,
    });

    if (!updated) throw new NotFoundException('issues.notFound');
    return updated;
  }
}
