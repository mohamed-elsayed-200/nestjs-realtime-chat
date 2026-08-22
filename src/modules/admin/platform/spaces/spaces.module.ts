import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { GetSpacesService } from './services/get-spaces.service';
import { DeleteSpaceService } from './services/delete-space.service';
import { UpdateSpaceService } from './services/update-space.service';
import { BaseMemberModule } from '../../../../common/modules/platform/members/members.module';
import { BaseMessageModule } from '../../../../common/modules/platform/messages/messages.module';

@Module({
  imports: [
    BaseSpaceModule,
    BaseMemberModule,
    BaseMessageModule,
    BaseAuthModule,
  ],
  controllers: [SpacesController],
  providers: [GetSpacesService, DeleteSpaceService, UpdateSpaceService],
})
export class SpacesModule {}
