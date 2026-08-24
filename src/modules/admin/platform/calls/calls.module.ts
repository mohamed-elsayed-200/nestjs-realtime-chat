import { BaseCallsModule } from '../../../../common/modules/platform/calls/calls.module';
import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { GetCallsListService } from './services/get-calls-list.service';
import { GetCallsStatsService } from './services/get-calls-stats.service';
import { CallsController } from './calls.controller';

@Module({
  imports: [BaseCallsModule, BaseAuthModule],
  controllers: [CallsController],
  providers: [GetCallsListService, GetCallsStatsService],
})
export class CallsModule {}
