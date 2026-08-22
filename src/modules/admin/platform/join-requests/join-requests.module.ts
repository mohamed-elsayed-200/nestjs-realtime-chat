import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { BaseJoinRequests } from '../../../../common/modules/platform/join-requests/join-requests.module';
import { JoinRequestsController } from './join-requests.controller';
import { AcceptJoinRequestService } from './services/accept-join-request.service';
import { CancelJoinRequestService } from './services/cancel-join-request.service';
import { DeleteJoinRequestService } from './services/delete-join-request.service';
import { GetJoinRequestService } from './services/get-join-requests.service';
import { RejectJoinRequestService } from './services/reject-join-request.service';
import { SendJoinRequestService } from './services/send-join-request.service';

@Module({
  imports: [
    BaseMemberModule,
    BaseAuthModule,
    BaseSpaceModule,
    BaseJoinRequests,
  ],
  controllers: [JoinRequestsController],
  providers: [
    AcceptJoinRequestService,
    CancelJoinRequestService,
    DeleteJoinRequestService,
    GetJoinRequestService,
    RejectJoinRequestService,
    SendJoinRequestService,
  ],
  exports: [
    AcceptJoinRequestService,
    CancelJoinRequestService,
    DeleteJoinRequestService,
    GetJoinRequestService,
    RejectJoinRequestService,
    SendJoinRequestService,
  ],
})
export class JoinRequestsModule {}
