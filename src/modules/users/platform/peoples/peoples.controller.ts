import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { QueryPeoplesDto } from './dto/query-peoples.dto';
import { GetPeoplesService } from './services/get-peoples.service';
import { GetSinglePeopleService } from './services/get-single-people.service';

@Controller('/users/peoples')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class PeoplesController {
  constructor(
    private readonly getPeoplesService: GetPeoplesService,
    private readonly getSinglePeopleService: GetSinglePeopleService,
  ) {}

  @Get()
  async getAll(
    @Query() queryPeoples: QueryPeoplesDto,
    @GetUser() authUser: any,
  ) {
    return this.getPeoplesService.get({
      queryPeoples,
      authUser,
    });
  }

  @Get('/:peopleIdOrUsername')
  @ResponseMeta({ message: 'peoples.foundOne' })
  public async getOne(
    @Param('peopleIdOrUsername', ValidateObjectIdPipe)
    peopleIdOrUsername: string,
  ) {
    return this.getSinglePeopleService.get({ peopleIdOrUsername });
  }
}
