import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseCallsModule } from '../../../../common/modules/platform/calls/calls.module';
import { CallsController } from './calls.controller';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { AcceptCallService } from './services/accept-call.service';
import { EndCallService } from './services/end-call.service';
import { GetActiveCallService } from './services/get-active-call-for-user.service';
import { GetCallSettingsServices } from './services/get-call-settings.service';
import { GetCallService } from './services/get-call.service';
import { JoinCallService } from './services/join-call.service';
import { LeaveCallService } from './services/leave-call.service';
import { RejectCallService } from './services/reject-call.service';
import { StartCallService } from './services/start-call.service';
import { ToggleParticipantMuteService } from './services/toggle-participant-mute.service';
import { UpdateCallService } from './services/update-call-settings.service';
import { ToggleRaiseHandService } from './services/toggle-raise-hand.service';

@Module({
  imports: [
    BaseAuthModule,
    BaseMessageModule,
    BaseSpaceModule,
    BaseCallsModule,
    BaseMemberModule,
  ],
  controllers: [CallsController],
  providers: [
    AcceptCallService,
    EndCallService,
    GetActiveCallService,
    GetCallSettingsServices,
    GetCallService,
    JoinCallService,
    LeaveCallService,
    RejectCallService,
    StartCallService,
    ToggleParticipantMuteService,
    ToggleRaiseHandService,
    UpdateCallService,
  ],
  exports: [
    AcceptCallService,
    EndCallService,
    GetActiveCallService,
    GetCallSettingsServices,
    GetCallService,
    JoinCallService,
    LeaveCallService,
    RejectCallService,
    StartCallService,
    ToggleParticipantMuteService,
    ToggleRaiseHandService,
    UpdateCallService,
  ],
})
export class CallsModule {}
