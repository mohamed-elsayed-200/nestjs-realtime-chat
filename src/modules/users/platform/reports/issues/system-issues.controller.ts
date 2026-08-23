import {
  Controller,
  Get,
  Post,
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
import { QueryDto } from '../../../../../common/modules/dto/query.dto';
import { CreateSystemIssueDto } from './dto/create-system-issue.dto';
import { UpdateSystemIssueDto } from './dto/update-system-issue.dto';
import { CreateSystemIssueService } from './services/create-system-issue.service';
import { GetMySystemIssuesService } from './services/get-my-system-issues.service';
import { GetMySystemIssueDetailsService } from './services/get-my-system-issue-details.service';
import { UpdateSystemIssueService } from './services/update-system-issue.service';

@Controller('/users/report-system-issues')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class SystemIssuesController {
  constructor(
    private readonly createSystemIssueService: CreateSystemIssueService,
    private readonly getMySystemIssuesService: GetMySystemIssuesService,
    private readonly getMySystemIssueDetailsService: GetMySystemIssueDetailsService,
    private readonly updateSystemIssueService: UpdateSystemIssueService,
  ) {}

  @Post()
  @ResponseMeta({ message: 'issues.created', statusCode: 201 })
  public async createIssue(
    @Body() dto: CreateSystemIssueDto,
    @GetUser() authUser: any,
  ) {
    return this.createSystemIssueService.create({ dto, authUser });
  }

  @Get()
  @ResponseMeta({ message: 'issues.foundAll' })
  public async getMyIssues(@Query() query: QueryDto, @GetUser() authUser: any) {
    return this.getMySystemIssuesService.get({ query, authUser });
  }

  @Get('/:issueId')
  @ResponseMeta({ message: 'issues.foundOne' })
  public async getMyIssue(
    @Param('issueId', ValidateObjectIdPipe) issueId: string,
    @GetUser() authUser: any,
  ) {
    return this.getMySystemIssueDetailsService.get({ issueId, authUser });
  }

  @Put('/:issueId')
  @ResponseMeta({ message: 'issues.updated' })
  public async updateIssue(
    @Param('issueId', ValidateObjectIdPipe) issueId: string,
    @Body() dto: UpdateSystemIssueDto,
    @GetUser() authUser: any,
  ) {
    return this.updateSystemIssueService.update({ issueId, dto, authUser });
  }
}
