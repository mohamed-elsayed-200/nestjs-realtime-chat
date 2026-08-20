import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { CommentsController } from './comments.controller';
import { BaseCommentsModule } from '../../../../common/modules/platform/comments/comments.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseReactionModule } from '../../../../common/modules/platform/reactions/reactions.module';
import { CreateCommentService } from './service/create-comment.service';
import { DeleteCommentService } from './service/delete-comment.service';
import { GetCommentService } from './service/get-comment.service';
import { GetCommentsService } from './service/get-comments.service';
import { GetRepliesCommentsService } from './service/get-replies-comments.service';
import { UpdateCommentService } from './service/update-comment.service';

@Module({
  imports: [
    BaseAuthModule,
    BaseCommentsModule,
    BaseMemberModule,
    BaseMessageModule,
    BaseReactionModule,
  ],
  controllers: [CommentsController],
  providers: [
    CreateCommentService,
    DeleteCommentService,
    GetCommentService,
    GetCommentsService,
    GetRepliesCommentsService,
    UpdateCommentService,
  ],
})
export class CommentsModule {}
