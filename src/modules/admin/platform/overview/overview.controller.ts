import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { GetOverviewStatsService } from './services/get-overview-stats.service';
import {
  GetPlatformActivityService,
  ActivityRange,
} from './services/get-platform-activity.service';
import { GetPendingActionsService } from './services/get-pending-actions.service';
import { GetRecentActivityService } from './services/get-recent-activity.service';
import { GetLiveCallsService } from './services/get-live-calls.service';

@Controller('/admins/overview')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class OverviewController {
  constructor(
    private readonly getOverviewStatsService: GetOverviewStatsService,
    private readonly getPlatformActivityService: GetPlatformActivityService,
    private readonly getPendingActionsService: GetPendingActionsService,
    private readonly getRecentActivityService: GetRecentActivityService,
    private readonly getLiveCallsService: GetLiveCallsService,
  ) {}

  @Get('/stats')
  @ResponseMeta({ message: 'overview.stats' })
  public async getStats() {
    return this.getOverviewStatsService.get();
  }

  @Get('/activity')
  @ResponseMeta({ message: 'overview.activity' })
  public async getActivity(@Query('range') range: ActivityRange = '7d') {
    return this.getPlatformActivityService.get({ range });
  }

  @Get('/pending-actions')
  @ResponseMeta({ message: 'overview.pendingActions' })
  public async getPendingActions() {
    return this.getPendingActionsService.get();
  }

  @Get('/recent-activity')
  @ResponseMeta({ message: 'overview.recentActivity' })
  public async getRecentActivity() {
    return this.getRecentActivityService.get({ limit: 5 });
  }

  @Get('/live-calls')
  @ResponseMeta({ message: 'overview.liveCalls' })
  public async getLiveCalls() {
    return this.getLiveCallsService.get({ limit: 5 });
  }
}
