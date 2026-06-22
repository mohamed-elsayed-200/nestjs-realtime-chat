import { Module } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';
import { SpacesGateway } from './spaces.gateway';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { BaseContactModule } from '../../../../common/modules/platform/contacts/contacts.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { ChannelsController } from './channels/channels.controller';
import { PrivatesController } from './privates/privates.controller';
import { GroupsController } from './groups/groups.controller';
import { ChannelsService } from './channels/channels.service';
import { PrivatesService } from './privates/privates.service';
import { GroupsService } from './groups/groups.service';

@Module({
  imports: [
    BaseSpaceModule,
    BaseMemberModule,
    BaseAuthModule,
    BaseContactModule,
    BaseMessageModule,
  ],
  controllers: [
    SpacesController,
    ChannelsController,
    PrivatesController,
    GroupsController,
  ],
  providers: [
    SpacesService,
    SpacesGateway,
    ChannelsService,
    PrivatesService,
    GroupsService,
  ],
  exports: [SpacesService, SpacesGateway],
})
export class SpacesModule {}
