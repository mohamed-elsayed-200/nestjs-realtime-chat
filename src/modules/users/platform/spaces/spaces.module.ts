import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { BaseContactModule } from '../../../../common/modules/platform/contacts/contacts.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';
import { BaseJoinRequests } from '../../../../common/modules/platform/join-requests/join-requests.module';
import { BaseCallsModule } from '../../../../common/modules/platform/calls/calls.module';
import { BaseBannedModule } from '../../../../common/modules/platform/banned/banned.module';
import { ChangeWallpaperSpaceService } from './services/change-wallpaper-space.service';
import { ClearHistorySpaceService } from './services/clear-history-space.service';
import { CreateGlobalSpaceService } from './services/create-global-space.service';
import { DeleteSpaceService } from './services/delete-space.service';
import { GetSingleSpaceService } from './services/get-single-space.service';
import { GetSpacesService } from './services/get-spaces.service';
import { GetSubspacesService } from './services/get-subspaces.service';
import { JoinToSpaceService } from './services/join-to-space.service';
import { LeaveFromSpaceService } from './services/leave-from-space.service';
import { MarkSpaceAsReadService } from './services/mark-space-as-read.service';
import { OpenLinkSpaceService } from './services/open-link-space.service';
import { ToggleArchiveSpaceService } from './services/toggle-archive-space.service';
import { TogglePinSpaceService } from './services/toggle-pin.service';
import { ToggleMuteSpaceService } from './services/toggle-mute-space.service';
import { UpdateGlobalSpaceService } from './services/update-global-space.service';
import { CreatePrivateSpaceService } from './services/create-private-space.service';

@Module({
  imports: [
    BaseSpaceModule,
    BaseMemberModule,
    BaseAuthModule,
    BaseContactModule,
    BaseMessageModule,
    BaseJoinRequests,
    BaseCallsModule,
    BaseBannedModule,
  ],
  controllers: [SpacesController],
  providers: [
    ChangeWallpaperSpaceService,
    ClearHistorySpaceService,
    CreateGlobalSpaceService,
    DeleteSpaceService,
    GetSingleSpaceService,
    GetSpacesService,
    GetSubspacesService,
    JoinToSpaceService,
    LeaveFromSpaceService,
    MarkSpaceAsReadService,
    OpenLinkSpaceService,
    ToggleArchiveSpaceService,
    ToggleMuteSpaceService,
    TogglePinSpaceService,
    UpdateGlobalSpaceService,
    CreatePrivateSpaceService,
  ],
  exports: [
    CreatePrivateSpaceService,
    ChangeWallpaperSpaceService,
    ClearHistorySpaceService,
    CreateGlobalSpaceService,
    DeleteSpaceService,
    GetSingleSpaceService,
    GetSpacesService,
    GetSubspacesService,
    JoinToSpaceService,
    LeaveFromSpaceService,
    MarkSpaceAsReadService,
    OpenLinkSpaceService,
    ToggleArchiveSpaceService,
    ToggleMuteSpaceService,
    TogglePinSpaceService,
    UpdateGlobalSpaceService,
  ],
})
export class SpacesModule {}
