import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { PeoplesService } from './peoples.service';

@Controller('/users/peoples')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class PeoplesController {
  constructor(private readonly peoplesService: PeoplesService) {}

  @Get()
  @ResponseMeta({ message: 'peoples.foundAll' })
  public async getAll(@Query() query: QueryDto, @GetUser() authUser: any) {
    return this.peoplesService.getAll({ query, authUser });
  }

  @Get('/:peopleIdOrUsername')
  @ResponseMeta({ message: 'peoples.foundOne' })
  public async getOne(
    @Param('peopleIdOrUsername', ValidateObjectIdPipe)
    peopleIdOrUsername: string,
  ) {
    return this.peoplesService.getOne({ peopleIdOrUsername });
  }
}
