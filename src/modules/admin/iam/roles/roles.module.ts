import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseRolesModule } from '../../../../common/modules/iam/roles/roles.module';

@Module({
  imports: [BaseRolesModule, BaseAuthModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
