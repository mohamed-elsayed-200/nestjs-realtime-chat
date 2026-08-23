import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ContentReportsRepository } from '../../../../../../common/modules/platform/reports/repositories/content-reports.repository';
import { ReportStatus } from '../../../../../../common/types/enums';

@Injectable()
export class CreateContentReportService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async create({ dto, authUser }) {
    const report = await this.contentReportsRepository.createOne({
      dto: {
        ...dto,
        reporter: authUser._id,
        status: ReportStatus.PENDING,
      },
    });

    if (!report) throw new InternalServerErrorException('reports.notCreated');
    return report;
  }
}
