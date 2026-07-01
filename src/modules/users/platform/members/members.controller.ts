import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { PromoteAdminDto } from './dto/promote-admin.dto';
import { DismissAdminDto } from './dto/dismiss-admin.dto';
import { ToggleRestrictedMemberDto } from './dto/toggle-mute-member.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { ToggleBanMemberDto } from './dto/toggle-ban-member.dto';

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

  @Get('/banned/:spaceId')
  @ResponseMeta({ message: 'members.foundAll' })
  public async getBannedBySpace(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @Query() query: QueryDto,
  ) {
    return this.membersService.getBannedBySpace({ query, spaceId });
  }

  @Post('/promote-admin')
  @ResponseMeta({ message: 'members.promoted', statusCode: 201 })
  public async addAdmin(
    @GetUser() authUser: any,
    @Body() dto: PromoteAdminDto,
  ) {
    return this.membersService.promoteAdmin({ dto, authUser });
  }

  @Post('/dismiss-admin')
  @ResponseMeta({ message: 'members.dismissed', statusCode: 201 })
  public async dismissAdmin(
    @GetUser() authUser: any,
    @Body() dto: DismissAdminDto,
  ) {
    return this.membersService.dismissAdmin({ dto, authUser });
  }

  @Post('/transfer-ownership')
  @ResponseMeta({ message: 'members.transferred', statusCode: 201 })
  public async transferOwnership(
    @GetUser() authUser: any,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.membersService.transferOwnership({ dto, authUser });
  }

  @Post('/toggle-restrict')
  @ResponseMeta({ message: 'members.toggled', statusCode: 201 })
  public async toggleRestrict(
    @GetUser() authUser: any,
    @Body() dto: ToggleRestrictedMemberDto,
  ) {
    return this.membersService.toggleRestrict({ dto, authUser });
  }

  @Post('/toggle-ban')
  @ResponseMeta({ message: 'members.toggled', statusCode: 201 })
  public async toggleBan(
    @GetUser() authUser: any,
    @Body() dto: ToggleBanMemberDto,
  ) {
    return this.membersService.toggleBan({ dto, authUser });
  }

  @Get('/:memberId')
  @ResponseMeta({ message: 'members.foundOne' })
  public async getOne(
    @Param('memberId', ValidateObjectIdPipe) memberId: string,
  ) {
    return this.membersService.getOne({ memberId });
  }
}
