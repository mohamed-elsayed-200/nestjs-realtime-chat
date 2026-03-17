import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { MembersService } from './members.service';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Controller('/admin/members')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}
  @Get()
  @ResponseMeta({ message: 'members.foundAll' })
  public async getAll(@Query() query: QueryDto) {
    return this.membersService.getAll({ query });
  }

  @Get('/:memberId')
  @ResponseMeta({ message: 'members.foundOne' })
  public async getOne(
    @Param('memberId', ValidateObjectIdPipe) memberId: string,
  ) {
    return this.membersService.getOne({ memberId });
  }

  @Post()
  @Permissions('members:create')
  @ResponseMeta({ message: 'members.created', statusCode: 201 })
  public async create(@Body() dto: CreateMemberDto) {
    return this.membersService.create({ dto });
  }

  @Put(':memberId')
  @Permissions('members:update')
  @ResponseMeta({ message: 'members.updated' })
  public async update(
    @Param('memberId', ValidateObjectIdPipe) memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update({ memberId, dto });
  }

  @Delete(':memberId')
  @Permissions('members:delete')
  @ResponseMeta({ message: 'members.deleted' })
  public async delete(
    @Param('memberId', ValidateObjectIdPipe) memberId: string,
  ) {
    return this.membersService.delete({ memberId });
  }
}
