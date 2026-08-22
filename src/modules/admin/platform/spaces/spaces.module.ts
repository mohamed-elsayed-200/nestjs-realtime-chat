import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseSpaceModule } from '../../../../common/modules/platform/spaces/spaces.module';
import { GetSpacesListService } from './services/get-space-list.service';

@Module({
  imports: [BaseSpaceModule, BaseAuthModule],
  controllers: [SpacesController],
  providers: [GetSpacesListService],
})
export class SpacesModule {}
