import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SystemIssuesRepository } from '../../../../../../common/modules/platform/reports/repositories/system-issues.repository';
import { IssueStatus } from '../../../../../../common/types/enums';

@Injectable()
export class CreateSystemIssueService {
  constructor(
    private readonly systemIssuesRepository: SystemIssuesRepository,
  ) {}

  public async create({ dto, authUser }) {
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
