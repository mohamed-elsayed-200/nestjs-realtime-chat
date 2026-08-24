import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ContentReportsRepository } from '../../../../../../common/modules/platform/reports/repositories/content-reports.repository';
import { ReportStatus } from '../../../../../../common/types/enums';

export interface UpdateReportStatusDto {
  status: ReportStatus;
  resolutionNotes?: string;
  actionTaken?: string;
  isActionTaken?: boolean;
}

@Injectable()
export class UpdateContentReportStatusService {
  constructor(
    private readonly contentReportsRepository: ContentReportsRepository,
  ) {}

  public async update({ reportId, dto, adminId }) {
    const report = await this.contentReportsRepository.findOne({
      query: { _id: new Types.ObjectId(reportId) },
    });

    if (!report) throw new NotFoundException('reports.notFound');

    const updatePayload: any = {
      status: dto.status,
      resolutionNotes: dto.resolutionNotes,
    };

    if (
      dto.status === ReportStatus.RESOLVED ||
      dto.status === ReportStatus.DISMISSED
    ) {
      updatePayload.resolvedBy = new Types.ObjectId(adminId);
      updatePayload.resolvedAt = new Date();
    }

    if (dto.actionTaken !== undefined) {
      updatePayload.actionTaken = dto.actionTaken;
      updatePayload.isActionTaken = !!dto.actionTaken || dto.isActionTaken;
    }

    const updated = await this.contentReportsRepository.updateOne({
      query: { _id: new Types.ObjectId(reportId) },
      dto: updatePayload,
    });

    if (!updated) throw new NotFoundException('reports.notFound');
    return updated;
  }
}
