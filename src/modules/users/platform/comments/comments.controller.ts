import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { CommentsService } from './comments.service';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('/users/comments')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('/by-message/:messageId')
  @ResponseMeta({ message: 'comments.foundAll' })
  public async getAll(
    @Query() query: QueryDto,
    @Param('messageId') messageId: string,
    @GetUser() authUser: any,
  ) {
    return this.commentsService.getAll({ query, messageId, authUser });
  }

  @Get('/replies/:parentId')
  @ResponseMeta({ message: 'comments.repliesFoundAll' })
  public async getReplies(
    @Query() query: QueryDto,
    @Param('parentId') parentId: string,
    @GetUser() authUser: any,
  ) {
    return this.commentsService.getReplies({ query, parentId, authUser });
  }

  @Get('/:commentId')
  @ResponseMeta({ message: 'comments.foundOne' })
  public async getOne(
    @Param('commentId', ValidateObjectIdPipe) commentId: string,
  ) {
    return this.commentsService.getOne({ commentId });
  }

  @Post()
  @ResponseMeta({ message: 'comments.created' })
  public async create(@Body() dto: CreateCommentDto, @GetUser() authUser: any) {
    return this.commentsService.create({ dto, authUser });
  }

  @Put('/:commentId')
  @ResponseMeta({ message: 'comments.updated' })
  public async update(
    @Param('commentId', ValidateObjectIdPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @GetUser() authUser: any,
  ) {
    return this.commentsService.update({ commentId, dto, authUser });
  }

  @Delete('/:commentId')
  @ResponseMeta({ message: 'comments.deleted' })
  public async delete(
    @Param('commentId', ValidateObjectIdPipe) commentId: string,
    @GetUser() authUser: any,
  ) {
    return this.commentsService.delete({ commentId, authUser });
  }
}
