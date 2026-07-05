import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { BaseCommentsModule } from '../../../../common/modules/platform/comments/comments.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';

@Module({
  imports: [BaseAuthModule, BaseCommentsModule, BaseMemberModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
