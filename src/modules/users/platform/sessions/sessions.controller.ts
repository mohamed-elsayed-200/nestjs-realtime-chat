import { Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { GetUser } from '../../../../common/decorators/get-user.decorator';

@Controller('/users/sessions')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}
  @Get()
  @ResponseMeta({ message: 'sessions.foundAll' })
  public async getAll(@GetUser() authUser: any) {
    return this.sessionsService.getAll({ authUser });
  }

  @Put('/:targetSessionId/active')
  @ResponseMeta({ message: 'sessions.activated' })
  public async active(
    @Param('targetSessionId', ValidateObjectIdPipe)
    targetSessionId: ValidateObjectIdPipe,
    @Req() req: any,
    @GetUser() authUser: any,
  ) {
    const currSessionId = req?.targetSessionId;
    return this.sessionsService.active({
      targetSessionId,
      currSessionId,
      authUser,
    });
  }
}
