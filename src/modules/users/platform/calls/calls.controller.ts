import { GetCallService } from './services/get-call.service';
import { GetActiveCallService } from './services/get-active-call-for-user.service';
import { GetCallSettingsServices } from './services/get-call-settings.service';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../common/decorators/get-user.decorator';

@Controller('/users/calls')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class CallsController {
  constructor(
    private readonly getCallSettingsServices: GetCallSettingsServices,
    private readonly getActiveCallService: GetActiveCallService,
    private readonly getCallService: GetCallService,
  ) {}

  @Get('/settings/:spaceId')
  @ResponseMeta({ message: 'calls.settings' })
  public getCallSettings(
    @Param('spaceId') spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.getCallSettingsServices.getCallSettings({ spaceId, authUser });
  }

  @Get('/active')
  @ResponseMeta({ message: 'calls.active' })
  public getActiveCall(@GetUser() authUser: any) {
    return this.getActiveCallService.getActiveCallForUser({ authUser });
  }

  @Get('/:callId')
  @ResponseMeta({ message: 'calls.byId' })
  public getCallById(
    @Param('callId') callId: string,
    @GetUser() authUser: any,
  ) {
    return this.getCallService.getCallById({ callId, authUser });
  }
}
