import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../../common/types/enums';
import { ResponseMeta } from '../../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../../common/pipes/validate-objectId.pipe';
import { UserTypes } from '../../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../../common/decorators/get-user.decorator';
import { GetContentReportsQueryDto } from './dto/get-content-reports-query.dto';
import { GetContentReportsStatsService } from './services/get-content-reports-stats.service';
import { GetContentReportsListService } from './services/get-content-reports-list.service';
import { GetContentReportDetailsService } from './services/get-content-report-details.service';
import {
  UpdateContentReportStatusService,
  UpdateReportStatusDto,
} from './services/update-content-report-status.service';

@Controller('/admins/report-contents')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class ContentReportsController {
  constructor(
    private readonly getContentReportsStatsService: GetContentReportsStatsService,
    private readonly getContentReportsListService: GetContentReportsListService,
    private readonly getContentReportDetailsService: GetContentReportDetailsService,
    private readonly updateContentReportStatusService: UpdateContentReportStatusService,
  ) {}

  @Get('stats')
  @ResponseMeta({ message: 'reports.stats' })
  public async getStats() {
    return this.getContentReportsStatsService.get();
  }

  @Get()
  @ResponseMeta({ message: 'reports.foundAll' })
  public async getList(@Query() query: GetContentReportsQueryDto) {
    return this.getContentReportsListService.get({ query });
  }

  @Get('/:reportId')
  @ResponseMeta({ message: 'reports.foundOne' })
  public async getDetails(
    @Param('reportId', ValidateObjectIdPipe) reportId: string,
  ) {
    return this.getContentReportDetailsService.get({ reportId });
  }

  @Put('/:reportId/status')
  @ResponseMeta({ message: 'reports.statusUpdated' })
  public async updateStatus(
    @Param('reportId', ValidateObjectIdPipe) reportId: string,
    @Body() dto: UpdateReportStatusDto,
    @GetUser() adminUser: any,
  ) {
    return this.updateContentReportStatusService.update({
      reportId,
      dto,
      adminId: adminUser._id,
    });
  }
}
