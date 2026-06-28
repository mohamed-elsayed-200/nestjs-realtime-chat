import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../../common/decorators/response.decorator';
import { UserTypeGuard } from '../../../../../common/guards/user-type.guard';
import { UserType } from '../../../../../common/types/enums';
import { UserTypes } from '../../../../../common/decorators/user-type.decorator';
import { GetUser } from '../../../../../common/decorators/get-user.decorator';
import { ValidateObjectIdPipe } from '../../../../../common/pipes/validate-objectId.pipe';
import { CreateChannelSpaceDto } from './dto/create-channel.dto';
import { ChannelsService } from './channels.service';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { InviteContactsDto } from './dto/invite-contacts.dto';
import { AddAdminDto } from './dto/add-admin.dto';

@Controller('/users/spaces/channel')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @ResponseMeta({ message: 'spaces.created', statusCode: 201 })
  public async create(
    @Body() dto: CreateChannelSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.channelsService.create({ dto, authUser });
  }

  @Post('/add-admin/:spaceId')
  @ResponseMeta({ message: 'spaces.joined', statusCode: 201 })
  public async addAdmin(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
    @Body() dto: AddAdminDto,
  ) {
    return this.channelsService.addAdmin({ spaceId, dto, authUser });
  }

  @Post('/invite-contacts/:spaceId')
  @ResponseMeta({ message: 'spaces.joined', statusCode: 201 })
  public async inviteContacts(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
    @Body() dto: InviteContactsDto,
  ) {
    return this.channelsService.inviteContacts({ spaceId, dto, authUser });
  }

  @Post('/join/:spaceId')
  @ResponseMeta({ message: 'spaces.joined', statusCode: 201 })
  public async join(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.channelsService.join({ spaceId, authUser });
  }

  @Post('/leave/:spaceId')
  @ResponseMeta({ message: 'spaces.joined', statusCode: 201 })
  public async leave(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.channelsService.leave({ spaceId, authUser });
  }

  @Put('/:spaceId')
  @ResponseMeta({ message: 'spaces.updated', statusCode: 201 })
  public async update(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @Body() dto: UpdateChannelDto,
    @GetUser() authUser: any,
  ) {
    return this.channelsService.update({ spaceId, dto, authUser });
  }
}
