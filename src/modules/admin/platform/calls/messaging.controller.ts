import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { GetCallsListService } from './services/get-calls-list.service';
import { GetCallsStatsService } from './services/get-calls-stats.service';
import { GetCallsQueryDto } from './dto/get-calls-query.dto';

@Controller('/admins/calls')
@UseGuards(AuthGuard, UserTypeGuard)
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class CallsController {
  constructor(
    private readonly getCallsListService: GetCallsListService,
    private readonly getCallsStatsService: GetCallsStatsService,
  ) {}

  @Get()
  @ResponseMeta({ message: 'calls.findAll' })
  public async getCalls(@Query() query: GetCallsQueryDto) {
    return this.getCallsListService.get({ query });
  }
  @Get('stats')
  @ResponseMeta({ message: 'calls.stats' })
  public async getStats() {
    return this.getCallsStatsService.get();
  }
}
