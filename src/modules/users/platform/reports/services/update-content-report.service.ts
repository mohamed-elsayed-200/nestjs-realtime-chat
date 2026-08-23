import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ContentReportsRepository } from '../../../../../common/modules/platform/reports/repositories/content-reports.repository';
import { ReportStatus } from '../../../../../common/types/enums';
import { UpdateContentReportDto } from '../dto/update-content-report.dto';

@Injectable()
export class UpdateContentReportService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async update({
    reportId,
    dto,
    authUser,
  }: {
    reportId: string;
    dto: UpdateContentReportDto;
    authUser: any;
  }) {
    const report = await this.contentReportsRepository.findOne({
      query: { _id: new Types.ObjectId(reportId) },
    });

    if (!report) throw new NotFoundException('reports.notFound');

    if (report.reporter?.toString() !== authUser._id.toString()) {
      throw new ForbiddenException('reports.forbidden');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('reports.alreadyProcessed');
    }

    const updated = await this.contentReportsRepository.updateOne({
      query: { _id: new Types.ObjectId(reportId) },
      dto,
    });

    if (!updated) throw new NotFoundException('reports.notFound');
    return updated;
  }
}
