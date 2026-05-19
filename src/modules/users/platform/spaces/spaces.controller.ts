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
import { CreateSpaceDto } from './dto/create-space.dto';
import { SpacesService } from './spaces.service';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { GetUser } from '../../../../common/decorators/get-user.decorator';

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

  @Post()
  @Permissions('spaces:create')
  @ResponseMeta({ message: 'spaces.created', statusCode: 201 })
  public async create(@Body() dto: CreateSpaceDto, @GetUser() authUser: any) {
    return this.spacesService.create({ dto, authUser });
  }

  @Put(':spaceId')
  @Permissions('spaces:update')
  @ResponseMeta({ message: 'spaces.updated' })
  public async update(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @Body() dto: UpdateSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.update({ spaceId, dto, authUser });
  }

  @Delete(':spaceId')
  @Permissions('spaces:delete')
  @ResponseMeta({ message: 'spaces.deleted' })
  public async delete(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @GetUser() authUser: any,
  ) {
    return this.spacesService.delete({ spaceId, authUser });
  }
}
