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
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { JoinRequestsService } from './join-requests.service';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { SendRequestDto } from './dto/send-request.dto';
import { AcceptRequestDto } from './dto/accept-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';

@Controller('/users/join-requests')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class JoinRequestsController {
  constructor(private readonly joinRequestsService: JoinRequestsService) {}

  @Get('/:space')
  @ResponseMeta({ message: 'joinRequests.foundOne' })
  public async getOne(
    @Param('space', ValidateObjectIdPipe) space: string,
    @GetUser() authUser: any,
    @Query() query: QueryDto,
  ) {
    return this.joinRequestsService.getAll({ space, query, authUser });
  }

  @Post('/send')
  @ResponseMeta({ message: 'joinRequests.sended' })
  public async sendRequest(
    @Body() dto: SendRequestDto,
    @GetUser() authUser: any,
  ) {
    return this.joinRequestsService.sendRequest({ dto, authUser });
  }

  @Put('/accept')
  @ResponseMeta({ message: 'joinRequests.accepted' })
  public async acceptRequest(
    @Body() dto: AcceptRequestDto,
    @GetUser() authUser: any,
  ) {
    return this.joinRequestsService.acceptRequest({ dto, authUser });
  }

  @Put('/reject')
  @ResponseMeta({ message: 'joinRequests.accepted' })
  public async rejectRequest(
    @Body() dto: RejectRequestDto,
    @GetUser() authUser: any,
  ) {
    return this.joinRequestsService.rejectRequest({ dto, authUser });
  }

  @Put('/cancel/:request')
  @ResponseMeta({ message: 'joinRequests.accepted' })
  public async cancelRequest(
    @Param('request', ValidateObjectIdPipe) request: string,
    @GetUser() authUser: any,
  ) {
    return this.joinRequestsService.cancelRequest({ request, authUser });
  }

  @Delete('/:request')
  @ResponseMeta({ message: 'joinRequests.accepted' })
  public async deleteRequest(
    @Param('request', ValidateObjectIdPipe) request: string,
    @GetUser() authUser: any,
  ) {
    return this.joinRequestsService.deleteRequest({ request, authUser });
  }
}
