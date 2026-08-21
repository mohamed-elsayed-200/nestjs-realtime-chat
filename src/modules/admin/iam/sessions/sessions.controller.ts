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
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { DeleteSessionService } from './services/delete-session.service';
import { InactiveSessionService } from './services/inactive-session.service';
import { ActiveSessionService } from './services/active-session.service';
import { GetSingleSessionService } from './services/get-single-session.service';
import { GetSessionsService } from './services/get-sessions.service';

@Controller('/admin/sessions')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class SessionsController {
  constructor(
    private readonly getSessionsService: GetSessionsService,
    private readonly getSingleSessionService: GetSingleSessionService,
    private readonly activeSessionService: ActiveSessionService,
    private readonly inactiveSessionService: InactiveSessionService,
    private readonly deleteSessionService: DeleteSessionService,
  ) {}
  @Get()
  @ResponseMeta({
    message: 'sessions.foundAll',
  })
  public async getAll(@Query() query: QueryDto) {
    return this.getSessionsService.get({ query });
  }

  @Get(':sessionId')
  @ResponseMeta({
    message: 'sessions.foundOne',
  })
  public async getOne(
    @Param('sessionId', ValidateObjectIdPipe)
    sessionId: ValidateObjectIdPipe,
  ) {
    return this.getSingleSessionService.get({ sessionId });
  }

  @Put('/:sessionId/active')
  @ResponseMeta({
    message: 'sessions.activated',
  })
  public async active(
    @Param('sessionId', ValidateObjectIdPipe)
    sessionId: ValidateObjectIdPipe,
    @Req() req: any,
  ) {
    const currSessionId = req?.sessionId;
    return this.activeSessionService.active({ sessionId, currSessionId });
  }

  @Put('/:sessionId/inactive')
  @ResponseMeta({
    message: 'sessions.inactivated',
  })
  public async inactive(
    @Param('sessionId', ValidateObjectIdPipe)
    sessionId: ValidateObjectIdPipe,
    @Req() req: any,
  ) {
    const currSessionId = req?.sessionId;
    return this.inactiveSessionService.inactive({ sessionId, currSessionId });
  }

  @Delete(':sessionId')
  @Permissions('sessions:delete')
  @ResponseMeta({
    message: 'sessions.deleted',
  })
  public async delete(
    @Param('sessionId', ValidateObjectIdPipe) sessionId: string,
    @Req() req: any,
  ) {
    const currSessionId = req?.sessionId;
    return this.deleteSessionService.delete({ sessionId, currSessionId });
  }
}
