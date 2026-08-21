import { DeleteRoleService } from './services/delete-role.service';
import { UpdateRolesService } from './services/update-role.service';
import { CreateRoleService } from './services/create-role.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { GetRolesService } from './services/get-roles.service';
import { GetSingleRolesService } from './services/get-single-role.service';

@Controller('/admins/roles')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class RolesController {
  constructor(
    private readonly getRolesService: GetRolesService,
    private readonly getSingleRoleService: GetSingleRolesService,
    private readonly createRoleService: CreateRoleService,
    private readonly updateRolesService: UpdateRolesService,
    private readonly deleteRoleService: DeleteRoleService,
  ) {}
  @Get()
  @ResponseMeta({
    message: 'roles.foundAll',
  })
  public async getAll(@Query() query: QueryDto) {
    return this.getRolesService.get({ query });
  }

  @Get(':roleId')
  @ResponseMeta({
    message: 'roles.foundOne',
  })
  public async getOne(
    @Param('roleId', ValidateObjectIdPipe)
    roleId: ValidateObjectIdPipe,
  ) {
    return this.getSingleRoleService.get({ roleId });
  }

  @Post()
  @Permissions('roles:create')
  @ResponseMeta({
    message: 'roles.created',
    statusCode: 201,
  })
  public async create(@Body() dto: CreateRoleDto) {
    return this.createRoleService.create({ dto });
  }

  @Put(':roleId')
  @Permissions('roles:edit')
  @ResponseMeta({
    message: 'roles.updated',
  })
  public async edit(
    @Param('roleId', ValidateObjectIdPipe) roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.updateRolesService.update({ roleId, dto });
  }

  @Delete(':roleId')
  @Permissions('roles:delete')
  @ResponseMeta({
    message: 'roles.deleted',
  })
  public async delete(@Param('roleId', ValidateObjectIdPipe) roleId: string) {
    return this.deleteRoleService.delete({ roleId });
  }
}
