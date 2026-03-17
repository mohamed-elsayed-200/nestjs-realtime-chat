import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { PermissionsService } from './permissions.service';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';

@Controller('/admin/permissions')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}
  @Get()
  @ResponseMeta({
    message: 'permissions.foundAll',
    statusCode: 200,
  })
  public async findAllByPaginate(@Query() query: QueryDto) {
    return this.permissionsService.getAll({ query });
  }

  @Get(':permissionId')
  @ResponseMeta({
    message: 'permissions.foundOne',
    statusCode: 200,
  })
  public async findOne(
    @Param('permissionId', ValidateObjectIdPipe)
    permissionId: ValidateObjectIdPipe,
  ) {
    return this.permissionsService.getOne({ permissionId });
  }
}
