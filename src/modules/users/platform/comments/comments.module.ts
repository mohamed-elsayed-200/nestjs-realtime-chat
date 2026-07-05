import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { BaseCommentsModule } from '../../../../common/modules/platform/comments/comments.module';

@Module({
  imports: [BaseAuthModule, BaseCommentsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
