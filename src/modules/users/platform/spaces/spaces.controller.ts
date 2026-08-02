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
import { ChangeWallpaperDto } from './dto/change-wallpaper.dto';
import { OpenLinkDto } from './dto/open-space.dto';
import { DeleteSpaceDto } from './dto/delete-space.dto';
import { CreatePrivateSpaceDto } from './dto/private-space/create-private-space.dto';
import { CreateGlobalSpaceDto } from './dto/global-space/create-global-space.dto';
import { UpdateGlobalSpaceDto } from './dto/global-space/update-global-space.dto';
import { InviteMembersToGlobalDto } from './dto/global-space/invite-members-to-global-space.dto';

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

  @Get('/:spaceOrUserId')
  @ResponseMeta({ message: 'spaces.foundOne' })
  public async getOne(
    @Param('spaceOrUserId', ValidateObjectIdPipe) spaceOrUserId: string,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.getOne({ spaceOrUserId, authUser });
  }

  @Get('/subspaces/:spaceId')
  @ResponseMeta({ message: 'spaces.subspaces' })
  public async getSubSpaces(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
    @Query() query: QueryDto,
  ) {
    return this.spacesService.getSubSpaces({ query, spaceId, authUser });
  }

  @Post('/open-link')
  @ResponseMeta({ message: 'spaces.opened', statusCode: 201 })
  public async openLink(@GetUser() authUser: any, @Body() dto: OpenLinkDto) {
    return this.spacesService.openLink({ dto, authUser });
  }

  @Put('/:spaceId/change-wallpaper')
  @ResponseMeta({ message: 'spaces.toggled', statusCode: 201 })
  public async changeWallpaper(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
    @Body() dto: ChangeWallpaperDto,
  ) {
    return this.spacesService.changeWallpaper({ spaceId, dto, authUser });
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

  @Put('/:spaceId/mark-as-read')
  @ResponseMeta({ message: 'spaces.toggled', statusCode: 201 })
  public async markAsRead(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.markSpaceAsRead({ spaceId, authUser });
  }

  @Delete(':spaceId')
  @ResponseMeta({ message: 'spaces.deleted' })
  public async delete(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
    @Body() dto: DeleteSpaceDto,
  ) {
    return this.spacesService.delete({ spaceId, dto, authUser });
  }

  @Post('/private-space')
  @ResponseMeta({ message: 'spaces.createdPrivate', statusCode: 201 })
  public async createPrivateSpace(
    @Body() dto: CreatePrivateSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.createPrivateSpace({ dto, authUser });
  }

  @Post('/global-space')
  @ResponseMeta({ message: 'spaces.createdGlobal', statusCode: 201 })
  public async createGlobalSpace(
    @Body() dto: CreateGlobalSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.createGlobalSpace({ dto, authUser });
  }

  @Put('/global-space/:spaceId')
  @ResponseMeta({ message: 'spaces.updated' })
  public async updateGlobalSpace(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @Body() dto: UpdateGlobalSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.updateGlobalSpace({ dto, spaceId, authUser });
  }

  @Post('/add-members/:spaceId')
  @ResponseMeta({ message: 'spaces.addedMembers', statusCode: 201 })
  public async addSubscribes(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
    @Body() dto: InviteMembersToGlobalDto,
  ) {
    return this.spacesService.addMembersToSpace({ spaceId, dto, authUser });
  }

  @Post('/join/:spaceId')
  @ResponseMeta({ message: 'spaces.joined', statusCode: 201 })
  public async join(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.joinToSpace({ spaceId, authUser });
  }

  @Post('/leave/:spaceId')
  @ResponseMeta({ message: 'spaces.leaved', statusCode: 201 })
  public async leave(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.leaveFromSpace({ spaceId, authUser });
  }
}
