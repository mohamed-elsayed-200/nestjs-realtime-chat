import {
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';

@Controller('/admin/sessions')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}
  @Get()
  @ResponseMeta({
    message: 'sessions.foundAll',
    statusCode: 200,
  })
  public async getAll(@Query() query: QueryDto) {
    return this.sessionsService.getAll({ query });
  }

  @Get(':sessionId')
  @ResponseMeta({
    message: 'sessions.foundOne',
    statusCode: 200,
  })
  public async getOne(
    @Param('sessionId', ValidateObjectIdPipe)
    sessionId: ValidateObjectIdPipe,
  ) {
    return this.sessionsService.getOne({ sessionId });
  }

  @Put('/:sessionId/active')
  @ResponseMeta({
    message: 'sessions.activated',
    statusCode: 200,
  })
  public async active(
    @Param('sessionId', ValidateObjectIdPipe)
    sessionId: ValidateObjectIdPipe,
    @Req() req: any,
  ) {
    const currSessionId = req?.sessionId;
    return this.sessionsService.active({ sessionId, currSessionId });
  }

  @Put('/:sessionId/inactive')
  @ResponseMeta({
    message: 'sessions.inactivated',
    statusCode: 200,
  })
  public async inactive(
    @Param('sessionId', ValidateObjectIdPipe)
    sessionId: ValidateObjectIdPipe,
    @Req() req: any,
  ) {
    const currSessionId = req?.sessionId;
    return this.sessionsService.inactive({ sessionId, currSessionId });
  }

  @Delete(':sessionId')
  @Permissions('sessions:delete')
  @ResponseMeta({
    message: 'sessions.deleted',
    statusCode: 200,
  })
  public async delete(
    @Param('sessionId', ValidateObjectIdPipe) sessionId: string,
    @Req() req: any,
  ) {
    const currSessionId = req?.sessionId;
    return this.sessionsService.delete({ sessionId, currSessionId });
  }
}
