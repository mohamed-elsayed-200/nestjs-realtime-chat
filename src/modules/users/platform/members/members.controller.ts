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

  @Get('/:memberId')
  @ResponseMeta({ message: 'members.foundOne' })
  public async getOne(
    @Param('memberId', ValidateObjectIdPipe) memberId: string,
  ) {
    return this.membersService.getOne({ memberId });
  }

  @Delete(':memberId')
  @ResponseMeta({ message: 'members.deleted' })
  public async delete(
    @Param('memberId', ValidateObjectIdPipe) memberId: string,
  ) {
    return this.membersService.delete({ memberId });
  }
}
