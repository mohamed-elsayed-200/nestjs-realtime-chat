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
import { ChangeChannelInfoDto } from './dto/change-channel-info.dto';

@Controller('/users/spaces/channel')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @ResponseMeta({ message: 'spaces.created', statusCode: 201 })
  public async createChannel(
    @Body() dto: CreateChannelSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.channelsService.createChannel({ dto, authUser });
  }

  @Put(':spaceId')
  @ResponseMeta({ message: 'spaces.updated', statusCode: 201 })
  public async changeChannelInfo(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @Body() dto: ChangeChannelInfoDto,
    @GetUser() authUser: any,
  ) {
    return this.channelsService.changeChannelInfo({ spaceId, dto, authUser });
  }
}
