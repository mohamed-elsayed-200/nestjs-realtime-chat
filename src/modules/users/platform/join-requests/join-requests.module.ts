import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { BaseJoinRequests } from '../../../../common/modules/platform/join-requests/join-requests.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { JoinRequestsService } from './join-requests.service';
import { JoinRequestsController } from './join-requests.controller';

@Module({
  imports: [
    BaseMemberModule,
    BaseAuthModule,
    BaseSpaceModule,
    BaseJoinRequests,
    BaseMessageModule,
  ],
  controllers: [JoinRequestsController],
  providers: [JoinRequestsService],
  exports: [JoinRequestsService],
})
export class JoinRequestsModule {}
