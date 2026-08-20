import { GetMessagesService } from './service/get-messages.service';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { GetUser } from '../../../../common/decorators/get-user.decorator';

@Controller('/users/messages')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class MessagesController {
  constructor(private readonly getMessagesService: GetMessagesService) {}
  @Get('/:spaceId')
  @ResponseMeta({ message: 'messages.foundAll' })
  public async getAll(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
    @Query() query: QueryDto,
  ) {
    return this.getMessagesService.get({ query, spaceId, authUser });
  }
}
