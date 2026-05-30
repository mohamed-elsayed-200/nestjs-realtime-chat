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
import { SpacesService } from './spaces.service';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { CreatePrivateSpaceDto } from './dto/create-private-space.dto';
import { CreateGroupSpaceDto } from './dto/create-group.dto';
import { CreateChannelSpaceDto } from './dto/create-channel.dto';

@Controller('/users/spaces')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}
  @Get()
  @ResponseMeta({ message: 'spaces.foundAll' })
  public async getAll(@Query() query: QueryDto, @GetUser() authUser: any) {
    return this.spacesService.getAll({ query, authUser });
  }

  @Get('/:spaceId')
  @ResponseMeta({ message: 'spaces.foundOne' })
  public async getOne(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.getOne({ spaceId, authUser });
  }

  @Post('/private')
  @ResponseMeta({ message: 'spaces.created', statusCode: 201 })
  public async createPrivate(
    @Body() dto: CreatePrivateSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.createPrivate({ dto, authUser });
  }

  @Post('/group')
  @ResponseMeta({ message: 'spaces.created', statusCode: 201 })
  public async createGroup(
    @Body() dto: CreateGroupSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.createGroup({ dto, authUser });
  }

  @Post('/channel')
  @ResponseMeta({ message: 'spaces.created', statusCode: 201 })
  public async createChannel(
    @Body() dto: CreateChannelSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.createChannel({ dto, authUser });
  }

  @Put('/:spaceId/toggle-pin')
  @ResponseMeta({ message: 'spaces.toggled', statusCode: 201 })
  public async togglePin(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.togglePin({ spaceId, authUser });
  }

  @Put('/:spaceId/toggle-mute')
  @ResponseMeta({ message: 'spaces.toggled', statusCode: 201 })
  public async toggleMute(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.toggleMute({ spaceId, authUser });
  }

  @Put('/:spaceId/toggle-archive')
  @ResponseMeta({ message: 'spaces.toggled', statusCode: 201 })
  public async toggleArchive(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.toggleArchive({ spaceId, authUser });
  }

  @Delete(':spaceId')
  @ResponseMeta({ message: 'spaces.deleted' })
  public async delete(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.delete({ spaceId, authUser });
  }
}
