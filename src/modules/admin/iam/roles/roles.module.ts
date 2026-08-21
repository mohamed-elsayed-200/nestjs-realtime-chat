import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { BaseRolesModule } from '../../../../common/modules/iam/roles/roles.module';
import { GetRolesService } from './services/get-roles.service';
import { GetSingleRolesService } from './services/get-single-role.service';
import { CreateRoleService } from './services/create-role.service';
import { UpdateRolesService } from './services/update-role.service';
import { DeleteRoleService } from './services/delete-role.service';

@Module({
  imports: [BaseRolesModule, BaseAuthModule],
  controllers: [RolesController],
  providers: [
    GetRolesService,
    GetSingleRolesService,
    CreateRoleService,
    UpdateRolesService,
    DeleteRoleService,
  ],
  exports: [
    GetRolesService,
    GetSingleRolesService,
    CreateRoleService,
    UpdateRolesService,
    DeleteRoleService,
  ],
})
export class RolesModule {}
