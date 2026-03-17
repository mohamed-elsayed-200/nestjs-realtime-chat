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
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('/admin/messages')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
  @Get()
  @ResponseMeta({ message: 'messages.foundAll' })
  public async getAll(@Query() query: QueryDto) {
    return this.messagesService.getAll({ query });
  }

  @Get('/:messageId')
  @ResponseMeta({ message: 'messages.foundOne' })
  public async getOne(
    @Param('messageId', ValidateObjectIdPipe) messageId: string,
  ) {
    return this.messagesService.getOne({ messageId });
  }

  @Post()
  @Permissions('messages:create')
  @ResponseMeta({ message: 'messages.created', statusCode: 201 })
  public async create(@Body() dto: CreateMessageDto) {
    return this.messagesService.create({ dto });
  }

  @Put(':messageId')
  @Permissions('messages:update')
  @ResponseMeta({ message: 'messages.updated' })
  public async update(
    @Param('messageId', ValidateObjectIdPipe) messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.update({ messageId, dto });
  }

  @Delete(':messageId')
  @Permissions('messages:delete')
  @ResponseMeta({ message: 'messages.deleted' })
  public async delete(
    @Param('messageId', ValidateObjectIdPipe) messageId: string,
  ) {
    return this.messagesService.delete({ messageId });
  }
}
