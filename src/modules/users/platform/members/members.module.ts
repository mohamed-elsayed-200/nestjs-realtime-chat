import { AddMembersToSpaceService } from './services/add-members-to-space.service';
import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { BaseBannedModule } from '../../../../common/modules/platform/banned/banned.module';
import { GetMembersService } from './services/get-members.service';
import { GetMemberService } from './services/get-member.service';
import { GetBannedMembersService } from './services/get-banned-members.service';
import { DismissMemberFromAdminService } from './services/dismiss-member-from-admin.service';
import { PromoteMemberToAdminService } from './services/promote-member-to-admin.service';
import { ToggleBanMemberService } from './services/toggle-ban.service';
import { TransferOwnershipService } from './services/transfer-ownership.service';
import { UpdateAdminPermissionsService } from './services/update-admin-permissions.service';
import { UpdateMemberPermissionsService } from './services/update-member-permissions.service';

@Module({
  imports: [
    BaseMemberModule,
    BaseAuthModule,
    BaseSpaceModule,
    BaseBannedModule,
  ],
  controllers: [MembersController],
  providers: [
    GetMembersService,
    GetMemberService,
    GetBannedMembersService,
    AddMembersToSpaceService,
    DismissMemberFromAdminService,
    PromoteMemberToAdminService,
    ToggleBanMemberService,
    TransferOwnershipService,
    UpdateAdminPermissionsService,
    UpdateMemberPermissionsService,
  ],
  exports: [
    GetMembersService,
    GetMemberService,
    GetBannedMembersService,
    AddMembersToSpaceService,
    DismissMemberFromAdminService,
    PromoteMemberToAdminService,
    ToggleBanMemberService,
    TransferOwnershipService,
    UpdateAdminPermissionsService,
    UpdateMemberPermissionsService,
  ],
})
export class MembersModule {}
