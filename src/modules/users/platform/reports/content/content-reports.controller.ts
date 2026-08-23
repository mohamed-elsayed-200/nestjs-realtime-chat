import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { QueryDto } from '../../../../../common/modules/dto/query.dto';
import { CreateContentReportService } from './services/create-content-report.service';
import { GetMyReportsService } from './services/get-my-reports.service';
import { GetMyReportDetailsService } from './services/get-my-report-details.service';
import { UpdateContentReportService } from './services/update-content-report.service';
import { DeleteContentReportService } from './services/delete-content-report.service';
import { CancelContentReportService } from './services/cancel-content-report.service';
import { CreateContentReportDto } from './dto/create-content-report.dto';
import { UpdateContentReportDto } from './dto/update-content-report.dto';

@Controller('/users/content-reports')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class ContentReportsController {
  constructor(
    private readonly createContentReportService: CreateContentReportService,
    private readonly getMyReportsService: GetMyReportsService,
    private readonly getMyReportDetailsService: GetMyReportDetailsService,
    private readonly updateContentReportService: UpdateContentReportService,
    private readonly deleteContentReportService: DeleteContentReportService,
    private readonly cancelContentReportService: CancelContentReportService,
  ) {}

  @Post()
  @ResponseMeta({ message: 'reports.created', statusCode: 201 })
  public async createReport(
    @Body() dto: CreateContentReportDto,
    @GetUser() authUser: any,
  ) {
    return this.createContentReportService.create({ dto, authUser });
  }

  @Get()
  @ResponseMeta({ message: 'reports.foundAll' })
  public async getMyReports(
    @Query() query: QueryDto,
    @GetUser() authUser: any,
  ) {
    return this.getMyReportsService.get({ query, authUser });
  }

  @Get('/:reportId')
  @ResponseMeta({ message: 'reports.foundOne' })
  public async getMyReport(
    @Param('reportId', ValidateObjectIdPipe) reportId: string,
    @GetUser() authUser: any,
  ) {
    return this.getMyReportDetailsService.get({ reportId, authUser });
  }

  @Put('/:reportId')
  @ResponseMeta({ message: 'reports.updated' })
  public async updateReport(
    @Param('reportId', ValidateObjectIdPipe) reportId: string,
    @Body() dto: UpdateContentReportDto,
    @GetUser() authUser: any,
  ) {
    return this.updateContentReportService.update({ reportId, dto, authUser });
  }

  @Delete('/:reportId')
  @ResponseMeta({ message: 'reports.deleted' })
  public async deleteReport(
    @Param('reportId', ValidateObjectIdPipe) reportId: string,
    @GetUser() authUser: any,
  ) {
    return this.deleteContentReportService.delete({ reportId, authUser });
  }

  @Put('/:reportId/cancel')
  @ResponseMeta({ message: 'reports.cancelled' })
  public async cancelReport(
    @Param('reportId', ValidateObjectIdPipe) reportId: string,
    @GetUser() authUser: any,
  ) {
    return this.cancelContentReportService.cancel({ reportId, authUser });
  }
}
