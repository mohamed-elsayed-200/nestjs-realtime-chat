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
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

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

  @Get('/:memberId')
  @ResponseMeta({ message: 'members.foundOne' })
  public async getOne(
    @Param('memberId', ValidateObjectIdPipe) memberId: string,
  ) {
    return this.membersService.getOne({ memberId });
  }

  @Post()
  @ResponseMeta({ message: 'members.created', statusCode: 201 })
  public async create(@Body() dto: CreateMemberDto) {
    return this.membersService.create({ dto });
  }

  @Put(':memberId')
  @ResponseMeta({ message: 'members.updated' })
  public async update(
    @Param('memberId', ValidateObjectIdPipe) memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update({ memberId, dto });
  }

  @Delete(':memberId')
  @ResponseMeta({ message: 'members.deleted' })
  public async delete(
    @Param('memberId', ValidateObjectIdPipe) memberId: string,
  ) {
    return this.membersService.delete({ memberId });
  }
}
