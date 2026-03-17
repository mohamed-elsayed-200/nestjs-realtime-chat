import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';

@Module({
  imports: [BaseMessageModule, BaseAuthModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
