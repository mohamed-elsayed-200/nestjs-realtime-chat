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
import { DeleteJoinRequestService } from './services/delete-join-request.service';
import { AcceptJoinRequestService } from './services/accept-join-request.service';
import { SendRequestDto } from './dto/send-request.dto';
import { AcceptRequestDto } from './dto/accept-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { CancelJoinRequestService } from './services/cancel-join-request.service';
import { GetJoinRequestService } from './services/get-join-requests.service';
import { RejectJoinRequestService } from './services/reject-join-request.service';
import { SendJoinRequestService } from './services/send-join-request.service';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';

@Controller('/admins/join-requests')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class JoinRequestsController {
  constructor(
    private readonly acceptJoinRequestService: AcceptJoinRequestService,
    private readonly cancelJoinRequestService: CancelJoinRequestService,
    private readonly deleteJoinRequestService: DeleteJoinRequestService,
    private readonly getJoinRequestService: GetJoinRequestService,
    private readonly rejectJoinRequestService: RejectJoinRequestService,
    private readonly sendJoinRequestService: SendJoinRequestService,
  ) {}

  @Get('/:space')
  @ResponseMeta({ message: 'joinRequests.foundOne' })
  public async getOne(
    @Param('space', ValidateObjectIdPipe) space: string,
    @GetUser() authUser: any,
    @Query() query: QueryDto,
  ) {
    return this.getJoinRequestService.get({ space, query, authUser });
  }

  @Post('/send')
  @ResponseMeta({ message: 'joinRequests.sended' })
  public async sendRequest(
    @Body() dto: SendRequestDto,
    @GetUser() authUser: any,
  ) {
    return this.sendJoinRequestService.send({ dto, authUser });
  }

  @Put('/accept')
  @ResponseMeta({ message: 'joinRequests.accepted' })
  public async acceptRequest(
    @Body() dto: AcceptRequestDto,
    @GetUser() authUser: any,
  ) {
    return this.acceptJoinRequestService.accept({ dto, authUser });
  }

  @Put('/reject')
  @ResponseMeta({ message: 'joinRequests.accepted' })
  public async rejectRequest(
    @Body() dto: RejectRequestDto,
    @GetUser() authUser: any,
  ) {
    return this.rejectJoinRequestService.reject({ dto, authUser });
  }

  @Put('/cancel/:request')
  @ResponseMeta({ message: 'joinRequests.accepted' })
  public async cancelRequest(
    @Param('request', ValidateObjectIdPipe) request: string,
    @GetUser() authUser: any,
  ) {
    return this.cancelJoinRequestService.cancel({ request, authUser });
  }

  @Delete('/:request')
  @ResponseMeta({ message: 'joinRequests.accepted' })
  public async deleteRequest(
    @Param('request', ValidateObjectIdPipe) request: string,
    @GetUser() authUser: any,
  ) {
    return this.deleteJoinRequestService.delete({ request, authUser });
  }
}
