import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { ReactionsService } from './reactions.service';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UpdateReactionDto } from './dto/update-reaction.dto';

@Controller('/admin/reactions')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}
  @Get()
  @ResponseMeta({ message: 'reactions.foundAll' })
  public async getAll(@Query() query: QueryDto) {
    return this.reactionsService.getAll({ query });
  }

  @Get('/:reactionId')
  @ResponseMeta({ message: 'reactions.foundOne' })
  public async getOne(
    @Param('reactionId', ValidateObjectIdPipe) reactionId: string,
  ) {
    return this.reactionsService.getOne({ reactionId });
  }

  @Post()
  @Permissions('reactions:create')
  @ResponseMeta({ message: 'reactions.created', statusCode: 201 })
  public async create(@Body() dto: CreateReactionDto) {
    return this.reactionsService.create({ dto });
  }

  @Put(':reactionId')
  @Permissions('reactions:update')
  @ResponseMeta({ message: 'reactions.updated' })
  public async update(
    @Param('reactionId', ValidateObjectIdPipe) reactionId: string,
    @Body() dto: UpdateReactionDto,
  ) {
    return this.reactionsService.update({ reactionId, dto });
  }

  @Delete(':reactionId')
  @Permissions('reactions:delete')
  @ResponseMeta({ message: 'reactions.deleted' })
  public async delete(
    @Param('reactionId', ValidateObjectIdPipe) reactionId: string,
  ) {
    return this.reactionsService.delete({ reactionId });
  }
}
