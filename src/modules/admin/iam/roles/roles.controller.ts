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
import { RolesService } from './roles.service';
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

@Controller('/admin/roles')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}
  @Get()
  @ResponseMeta({
    message: 'roles.foundAll',
    statusCode: 200,
  })
  public async getAll(@Query() query: QueryDto) {
    return this.rolesService.getAll({ query });
  }

  @Get(':roleId')
  @ResponseMeta({
    message: 'roles.foundOne',
    statusCode: 200,
  })
  public async getOne(
    @Param('roleId', ValidateObjectIdPipe)
    roleId: ValidateObjectIdPipe,
  ) {
    return this.rolesService.getOne({ roleId });
  }

  @Post()
  @Permissions('roles:create')
  @ResponseMeta({
    message: 'roles.created',
    statusCode: 201,
  })
  public async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create({ dto });
  }

  @Put(':roleId')
  @Permissions('roles:edit')
  @ResponseMeta({
    message: 'roles.updated',
    statusCode: 200,
  })
  public async edit(
    @Param('roleId', ValidateObjectIdPipe) roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update({ roleId, dto });
  }

  @Delete(':roleId')
  @Permissions('roles:delete')
  @ResponseMeta({
    message: 'roles.deleted',
    statusCode: 200,
  })
  public async delete(@Param('roleId', ValidateObjectIdPipe) roleId: string) {
    return this.rolesService.delete({ roleId });
  }
}
