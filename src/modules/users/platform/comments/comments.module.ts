import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { BaseCommentsModule } from '../../../../common/modules/platform/comments/comments.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';

@Module({
  imports: [
    BaseAuthModule,
    BaseCommentsModule,
    BaseMemberModule,
    BaseMessageModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
