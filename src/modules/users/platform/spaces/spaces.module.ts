import { Module } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';
import { SpacesGateway } from './spaces.gateway';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { BaseContactModule } from '../../../../common/modules/platform/contacts/contacts.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseJoinRequests } from '../../../../common/modules/platform/join-requests/join-requests.module';

@Module({
  imports: [
    BaseSpaceModule,
    BaseMemberModule,
    BaseAuthModule,
    BaseContactModule,
    BaseMessageModule,
    BaseJoinRequests,
  ],
  controllers: [SpacesController],
  providers: [SpacesService, SpacesGateway],
  exports: [SpacesService, SpacesGateway],
})
export class SpacesModule {}
