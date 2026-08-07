import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseCallsModule } from '../../../../common/modules/platform/calls/calls.module';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

@Module({
  imports: [BaseAuthModule, BaseCallsModule],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}
