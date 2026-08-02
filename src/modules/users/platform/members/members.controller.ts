import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';

@Controller('/users/members')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('/for-space/:spaceId')
  @ResponseMeta({ message: 'members.foundAll' })
  public async getAll(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @Query() query: QueryDto,
  ) {
    return this.membersService.getAll({ query, spaceId });
  }

  @Get('/single-member')
  @ResponseMeta({ message: 'members.foundOne' })
  public async getOne(@Query() query: string) {
    return this.membersService.getOne({ query });
  }

  @Get('/banned/:spaceId')
  @ResponseMeta({ message: 'members.foundBannedList' })
  public async getBannedBySpace(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @Query() query: QueryDto,
  ) {
    return this.membersService.getBannedBySpace({ query, spaceId });
  }
}
