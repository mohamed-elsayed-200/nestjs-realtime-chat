import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { OverviewController } from './overview.controller';
import { GetLiveCallsService } from './services/get-live-calls.service';
import { GetOverviewStatsService } from './services/get-overview-stats.service';
import { GetPendingActionsService } from './services/get-pending-actions.service';
import { GetPlatformActivityService } from './services/get-platform-activity.service';
import { GetRecentActivityService } from './services/get-recent-activity.service';
import { BaseCallsModule } from './../../../../common/modules/platform/calls/calls.module';
import { BaseSpaceModule } from './../../../../common/modules/platform/spaces/spaces.module';
import { BaseReportsModule } from './../../../../common/modules/platform/reports/reports.module';
import { BaseMessageModule } from './../../../../common/modules/platform/messages/messages.module';

@Module({
  imports: [
    BaseSpaceModule,
    BaseMessageModule,
    BaseCallsModule,
    BaseAuthModule,
    BaseReportsModule,
  ],
  controllers: [OverviewController],
  providers: [
    GetLiveCallsService,
    GetOverviewStatsService,
    GetPendingActionsService,
    GetPlatformActivityService,
    GetRecentActivityService,
  ],
})
export class OverviewModule {}
