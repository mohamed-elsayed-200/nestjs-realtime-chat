import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { GetSpacesService } from './services/get-spaces.service';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { QueryGetSpacesDto } from './dto/query-get-spaces.dto';

@Controller('/admins/spaces')
@UseGuards(AuthGuard, UserTypeGuard)
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class SpacesController {
  constructor(private readonly getSpacesService: GetSpacesService) {}

  @Get()
  @ResponseMeta({ message: 'spaces.findAll' })
  public async getSpaces(@Query() query: QueryGetSpacesDto) {
    return this.getSpacesService.get({ query });
  }
}
