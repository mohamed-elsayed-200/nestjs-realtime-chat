import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseCallsModule } from '../../../../common/modules/platform/calls/calls.module';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';

@Module({
  imports: [
    BaseAuthModule,
    BaseMessageModule,
    BaseSpaceModule,
    BaseCallsModule,
  ],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
