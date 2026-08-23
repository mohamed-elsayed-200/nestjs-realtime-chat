import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SystemIssuesRepository } from '../../../../../../common/modules/platform/reports/repositories/system-issues.repository';

@Injectable()
export class GetMySystemIssueDetailsService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async get({ issueId, authUser }: { issueId: string; authUser: any }) {
    const issue = await this.systemIssuesRepository.findOne({
      query: { _id: new Types.ObjectId(issueId) },
    });

    if (!issue) throw new NotFoundException('issues.notFound');

    if (issue.reportedBy?.toString() !== authUser._id.toString()) {
      throw new ForbiddenException('issues.forbidden');
    }

    return issue;
  }
}
