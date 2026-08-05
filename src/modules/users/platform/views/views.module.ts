import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseViewsModule } from '../../../../common/modules/platform/views/views.module';
import { ViewsService } from './views.service';
import { ViewsController } from './views.controller';

@Module({
  imports: [BaseMessageModule, BaseAuthModule, BaseViewsModule],
  controllers: [ViewsController],
  providers: [ViewsService],
  exports: [ViewsService],
})
export class ViewsModule {}
