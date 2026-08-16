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
import { SpacesService } from './spaces.service';
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

  @Post('/global-space')
  @ResponseMeta({ message: 'spaces.createdGlobal', statusCode: 201 })
  public async createGlobalSpace(
    @Body() dto: CreateGlobalSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.createGlobalSpace({ dto, authUser });
  }
}
