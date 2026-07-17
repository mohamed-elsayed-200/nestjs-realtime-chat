import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { ToggleBanMemberDto } from './dto/toggle-ban-member.dto';
import { PromoteAdminDto } from './dto/promote-admin.dto';
import { UpdateAdminPermissionsDto } from './dto/update-admin-permissions.dto';
import { UpdateMemberPermissionsDto } from './dto/update-member-permissions.dto';
import { DismissAdminDto } from './dto/dismiss-admin.dto';

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

  @Post('/promote-admin')
  @ResponseMeta({ message: 'members.transferred', statusCode: 201 })
  public async promoteAdmin(
    @GetUser() authUser: any,
    @Body() dto: PromoteAdminDto,
  ) {
    return this.membersService.promoteAdmin({ dto, authUser });
  }

  @Put('/dismiss-admin')
  @ResponseMeta({ message: 'members.transferred', statusCode: 201 })
  public async DismissAdmin(
    @GetUser() authUser: any,
    @Body() dto: DismissAdminDto,
  ) {
    return this.membersService.dismissAdmin({ dto, authUser });
  }

  @Put('/admin-permissions')
  @ResponseMeta({ message: 'members.transferred', statusCode: 201 })
  public async updateAdminPermissions(
    @GetUser() authUser: any,
    @Body() dto: UpdateAdminPermissionsDto,
  ) {
    return this.membersService.updateAdminPermissions({ dto, authUser });
  }

  @Put('/member-permissions')
  @ResponseMeta({ message: 'members.transferred', statusCode: 201 })
  public async updateMemberPermissions(
    @GetUser() authUser: any,
    @Body() dto: UpdateMemberPermissionsDto,
  ) {
    return this.membersService.updateMemberPermissions({ dto, authUser });
  }

  @Post('/transfer-ownership')
  @ResponseMeta({ message: 'members.transferred', statusCode: 201 })
  public async transferOwnership(
    @GetUser() authUser: any,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.membersService.transferOwnership({ dto, authUser });
  }

  @Post('/toggle-ban')
  @ResponseMeta({ message: 'members.toggled', statusCode: 201 })
  public async toggleBan(
    @GetUser() authUser: any,
    @Body() dto: ToggleBanMemberDto,
  ) {
    return this.membersService.toggleBan({ dto, authUser });
  }
}
