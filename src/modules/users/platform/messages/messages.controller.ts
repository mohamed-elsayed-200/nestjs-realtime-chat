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
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('/users/messages')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
  @Get(':/chatId')
  @ResponseMeta({ message: 'messages.foundAll' })
  public async getAll(
    @Param('chatId', ValidateObjectIdPipe) chatId: string,
    @GetUser() authUser: any,
    @Query() query: QueryDto,
  ) {
    return this.messagesService.getAll({ query, chatId, authUser });
  }

  @Post()
  @ResponseMeta({ message: 'messages.created', statusCode: 201 })
  public async create(@Body() dto: CreateMessageDto) {
    return this.messagesService.create({ dto });
  }

  @Put(':messageId')
  @ResponseMeta({ message: 'messages.updated' })
  public async update(
    @Param('messageId', ValidateObjectIdPipe) messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.update({ messageId, dto });
  }

  @Delete(':messageId')
  @ResponseMeta({ message: 'messages.deleted' })
  public async delete(
    @Param('messageId', ValidateObjectIdPipe) messageId: string,
  ) {
    return this.messagesService.delete({ messageId });
  }
}
