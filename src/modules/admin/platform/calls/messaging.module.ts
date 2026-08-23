import { BaseCallsModule } from './../../../../common/modules/platform/calls/calls.module';
import { Module } from '@nestjs/common';
import { CallsController } from './messaging.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { GetCallsListService } from './services/get-calls-list.service';
import { GetCallsStatsService } from './services/get-calls-stats.service';

@Module({
  imports: [BaseCallsModule, BaseAuthModule],
  controllers: [CallsController],
  providers: [GetCallsListService, GetCallsStatsService],
})
export class CallsModule {}
