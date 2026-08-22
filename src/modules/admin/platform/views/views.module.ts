import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseViewsModule } from '../../../../common/modules/platform/views/views.module';
import { ViewsController } from './views.controller';
import { ViewMessageService } from './services/view-message.service';
import { GetViewsService } from './services/get-views.service';

@Module({
  imports: [BaseMessageModule, BaseAuthModule, BaseViewsModule],
  controllers: [ViewsController],
  providers: [ViewMessageService, GetViewsService],
  exports: [ViewMessageService],
})
export class ViewsModule {}
