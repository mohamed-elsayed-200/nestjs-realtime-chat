import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { GetMessagingStatsService } from './services/get-stats.service';

@Module({
  imports: [BaseMessageModule, BaseSpaceModule, BaseAuthModule],
  controllers: [MessagingController],
  providers: [GetMessagingStatsService],
})
export class MessagingModule {}
