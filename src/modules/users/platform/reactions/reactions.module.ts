import { Module } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { ReactionsController } from './reactions.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseReactionModule } from '../../../../common/modules/platform/reactions/reactions.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseCommentsModule } from '../../../../common/modules/platform/comments/comments.module';

@Module({
  imports: [
    BaseReactionModule,
    BaseAuthModule,
    BaseMessageModule,
    BaseCommentsModule,
  ],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
