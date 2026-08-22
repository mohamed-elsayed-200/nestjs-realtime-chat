import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { SpaceTypes, UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { GetMessagingStatsService } from './services/get-stats.service';
import { GetSpacesListService } from './services/get-space-list.service';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { QueryGetMessagingSpacesDto } from './dto/query-get-messaging-spaces.dto';

@Controller('/admins/messaging')
@UseGuards(AuthGuard, UserTypeGuard)
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class MessagingController {
  constructor(
    private readonly getMessagingStatsService: GetMessagingStatsService,
    private readonly getSpacesListService: GetSpacesListService,
  ) {}

  @Get('stats')
  @ResponseMeta({ message: 'messaging.stats' })
  public async getStats(@Query('spaceType') spaceType: SpaceTypes) {
    return this.getMessagingStatsService.get({ spaceType });
  }

  @Get('spaces')
  @ResponseMeta({ message: 'messaging.spaces' })
  public async getSpaces(@Query() query: QueryGetMessagingSpacesDto) {
    return this.getSpacesListService.get({ query });
  }
}
