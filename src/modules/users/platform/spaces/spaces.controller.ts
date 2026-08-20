import { TogglePinSpaceService } from './services/toggle-pin.service';
import { ToggleMuteSpaceService } from './services/toggle-mute-space.service';
import { ToggleArchiveSpaceService } from './services/toggle-archive-space.service';
import { OpenLinkSpaceService } from './services/open-link-space.service';
import { GetSubspacesService } from './services/get-subspaces.service';
import { GetSpacesService } from './services/get-spaces.service';
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
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { OpenLinkDto } from './dto/open-space.dto';
import { CreateGlobalSpaceDto } from './dto/global-space/create-global-space.dto';
import { GetSingleSpaceService } from './services/get-single-space.service';
import { CreateGlobalSpaceService } from './services/create-global-space.service';

@Controller('/users/spaces')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class SpacesController {
  constructor(
    private readonly getSpacesService: GetSpacesService,
    private readonly getSingleSpaceService: GetSingleSpaceService,
    private readonly getSubspacesService: GetSubspacesService,
    private readonly openLinkSpaceService: OpenLinkSpaceService,
    private readonly TogglePinSpaceService: TogglePinSpaceService,
    private readonly toggleArchiveSpaceService: ToggleArchiveSpaceService,
    private readonly toggleMuteSpaceService: ToggleMuteSpaceService,
    private readonly createGlobalSpaceService: CreateGlobalSpaceService,
  ) {}
  @Get()
  @ResponseMeta({ message: 'spaces.foundAll' })
  public async getAll(@Query() query: QueryDto, @GetUser() authUser: any) {
    return this.getSpacesService.get({ query, authUser });
  }

  @Get('/:spaceOrUserId')
  @ResponseMeta({ message: 'spaces.foundOne' })
  public async getOne(
    @Param('spaceOrUserId', ValidateObjectIdPipe) spaceOrUserId: string,
    @GetUser() authUser: any,
  ) {
    return this.getSingleSpaceService.get({ spaceOrUserId, authUser });
  }

  @Get('/subspaces/:spaceId')
  @ResponseMeta({ message: 'spaces.subspaces' })
  public async getSubSpaces(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
    @Query() query: QueryDto,
  ) {
    return this.getSubspacesService.get({ query, spaceId, authUser });
  }

  @Post('/open-link')
  @ResponseMeta({ message: 'spaces.opened', statusCode: 201 })
  public async openLink(@GetUser() authUser: any, @Body() dto: OpenLinkDto) {
    return this.openLinkSpaceService.open({ dto, authUser });
  }

  @Put('/:spaceId/toggle-pin')
  @ResponseMeta({ message: 'spaces.toggled', statusCode: 201 })
  public async togglePin(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.TogglePinSpaceService.toggle({ spaceId, authUser });
  }

  @Put('/:spaceId/toggle-mute')
  @ResponseMeta({ message: 'spaces.toggled', statusCode: 201 })
  public async toggleMute(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.toggleMuteSpaceService.toggle({ spaceId, authUser });
  }

  @Put('/:spaceId/toggle-archive')
  @ResponseMeta({ message: 'spaces.toggled', statusCode: 201 })
  public async toggleArchive(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.toggleArchiveSpaceService.toggle({ spaceId, authUser });
  }

  @Post('/global-space')
  @ResponseMeta({ message: 'spaces.createdGlobal', statusCode: 201 })
  public async createGlobalSpace(
    @Body() dto: CreateGlobalSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.createGlobalSpaceService.create({ dto, authUser });
  }
}
