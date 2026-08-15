import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { BannedService } from './banned.service';

@Controller('/users/banned')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class BannedController {
  constructor(private readonly bannedService: BannedService) {}

  @Get('banned-users')
  @ResponseMeta({ message: 'banned.foundAll' })
  public async getBannedUsers(
    @Query() query: QueryDto,
    @GetUser() authUser: any,
  ) {
    return this.bannedService.getBannedUsers({ query, authUser });
  }

  @Get('users-who-banned-me')
  @ResponseMeta({ message: 'banned.foundAll' })
  public async getUsersWhoBannedMe(
    @Query() query: QueryDto,
    @GetUser() authUser: any,
  ) {
    return this.bannedService.getUsersWhoBannedMe({ query, authUser });
  }
}
