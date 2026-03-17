import { Module } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { ReactionsController } from './reactions.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseReactionModule } from '../../../../common/modules/platform/reactions/reactions.module';

@Module({
  imports: [BaseReactionModule, BaseAuthModule],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
