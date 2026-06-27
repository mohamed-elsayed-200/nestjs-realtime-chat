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
}
