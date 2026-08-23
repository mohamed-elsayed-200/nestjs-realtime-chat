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
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { CreateContentReportDto } from './dto/create-content-report.dto';
import { UpdateContentReportDto } from './dto/update-content-report.dto';
import { CreateSystemIssueDto } from './dto/create-system-issue.dto';
import { UpdateSystemIssueDto } from './dto/update-system-issue.dto';
import { CreateContentReportService } from './services/create-content-report.service';
import { GetMyReportsService } from './services/get-my-reports.service';
import { GetMyReportDetailsService } from './services/get-my-report-details.service';
import { UpdateContentReportService } from './services/update-content-report.service';
import { DeleteContentReportService } from './services/delete-content-report.service';
import { CancelContentReportService } from './services/cancel-content-report.service';
import { CreateSystemIssueService } from './services/create-system-issue.service';
import { GetMySystemIssuesService } from './services/get-my-system-issues.service';
import { GetMySystemIssueDetailsService } from './services/get-my-system-issue-details.service';
import { UpdateSystemIssueService } from './services/update-system-issue.service';

@Controller('/users/reports')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class ReportsController {
  constructor(
    private readonly createContentReportService: CreateContentReportService,
    private readonly getMyReportsService: GetMyReportsService,
    private readonly getMyReportDetailsService: GetMyReportDetailsService,
    private readonly updateContentReportService: UpdateContentReportService,
    private readonly deleteContentReportService: DeleteContentReportService,
    private readonly cancelContentReportService: CancelContentReportService,
    private readonly createSystemIssueService: CreateSystemIssueService,
    private readonly getMySystemIssuesService: GetMySystemIssuesService,
    private readonly getMySystemIssueDetailsService: GetMySystemIssueDetailsService,
    private readonly updateSystemIssueService: UpdateSystemIssueService,
  ) {}

  // ─── Content Reports ───
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

  // ─── System Issues ───
  @Post('issues')
  @ResponseMeta({ message: 'issues.created', statusCode: 201 })
  public async createIssue(
    @Body() dto: CreateSystemIssueDto,
    @GetUser() authUser: any,
  ) {
    return this.createSystemIssueService.create({ dto, authUser });
  }

  @Get('issues')
  @ResponseMeta({ message: 'issues.foundAll' })
  public async getMyIssues(@Query() query: QueryDto, @GetUser() authUser: any) {
    return this.getMySystemIssuesService.get({ query, authUser });
  }

  @Get('issues/:issueId')
  @ResponseMeta({ message: 'issues.foundOne' })
  public async getMyIssue(
    @Param('issueId', ValidateObjectIdPipe) issueId: string,
    @GetUser() authUser: any,
  ) {
    return this.getMySystemIssueDetailsService.get({ issueId, authUser });
  }

  @Put('issues/:issueId')
  @ResponseMeta({ message: 'issues.updated' })
  public async updateIssue(
    @Param('issueId', ValidateObjectIdPipe) issueId: string,
    @Body() dto: UpdateSystemIssueDto,
    @GetUser() authUser: any,
  ) {
    return this.updateSystemIssueService.update({ issueId, dto, authUser });
  }
}
