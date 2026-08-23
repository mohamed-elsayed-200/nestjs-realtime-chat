import {
  Controller,
  Get,
  Put,
  Patch,
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
import { GetSystemIssuesQueryDto } from './dto/get-system-issues-query.dto';
import { GetSystemIssuesStatsService } from './services/get-system-issues-stats.service';
import { GetSystemIssuesListService } from './services/get-system-issues-list.service';
import { GetSystemIssueDetailsService } from './services/get-system-issue-details.service';
import {
  UpdateSystemIssueStatusService,
  UpdateIssueStatusDto,
} from './services/update-system-issue-status.service';
import { AssignSystemIssueService } from './services/assign-system-issue.service';

@Controller('/admins/system-issues')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class SystemIssuesController {
  constructor(
    private readonly getSystemIssuesStatsService: GetSystemIssuesStatsService,
    private readonly getSystemIssuesListService: GetSystemIssuesListService,
    private readonly getSystemIssueDetailsService: GetSystemIssueDetailsService,
    private readonly updateSystemIssueStatusService: UpdateSystemIssueStatusService,
    private readonly assignSystemIssueService: AssignSystemIssueService,
  ) {}

  @Get('stats')
  @ResponseMeta({ message: 'issues.stats' })
  public async getStats() {
    return this.getSystemIssuesStatsService.get();
  }

  @Get()
  @ResponseMeta({ message: 'issues.foundAll' })
  public async getList(@Query() query: GetSystemIssuesQueryDto) {
    return this.getSystemIssuesListService.get({ query });
  }

  @Get('/:issueId')
  @ResponseMeta({ message: 'issues.foundOne' })
  public async getDetails(
    @Param('issueId', ValidateObjectIdPipe) issueId: string,
  ) {
    return this.getSystemIssueDetailsService.get({ issueId });
  }

  @Put('/:issueId/status')
  @ResponseMeta({ message: 'issues.statusUpdated' })
  public async updateStatus(
    @Param('issueId', ValidateObjectIdPipe) issueId: string,
    @Body() dto: UpdateIssueStatusDto,
    @GetUser() adminUser: any,
  ) {
    return this.updateSystemIssueStatusService.update({
      issueId,
      dto,
      adminId: adminUser._id,
    });
  }

  @Patch('/:issueId/assign')
  @ResponseMeta({ message: 'issues.assigned' })
  public async assign(
    @Param('issueId', ValidateObjectIdPipe) issueId: string,
    @GetUser() adminUser: any,
  ) {
    return this.assignSystemIssueService.assign({
      issueId,
      adminId: adminUser._id,
    });
  }
}
