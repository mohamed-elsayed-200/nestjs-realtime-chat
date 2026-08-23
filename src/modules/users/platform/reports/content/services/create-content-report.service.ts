import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ContentReportsRepository } from '../../../../../../common/modules/platform/reports/repositories/content-reports.repository';
import { ReportStatus } from '../../../../../../common/types/enums';

@Injectable()
export class CreateContentReportService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async create({ dto, authUser }) {
    // Check if report already exists for this reporter + target
    const existingReport = await this.contentReportsRepository.findOne({
      query: {
        reporter: new Types.ObjectId(authUser._id),
        targetId: new Types.ObjectId(dto.targetId),
      },
    });

    // If exists, return it without creating a new one
    if (existingReport) {
      return existingReport;
    }

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