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

@Controller('/users/spaces')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}
  @Get()
  @ResponseMeta({ message: 'spaces.foundAll' })
  public async getAll(@Query() query: QueryDto) {
    return this.spacesService.getAll({ query });
  }

  @Get('/:spaceId')
  @ResponseMeta({ message: 'spaces.foundOne' })
  public async getOne(@Param('spaceId', ValidateObjectIdPipe) spaceId: string) {
    return this.spacesService.getOne({ spaceId });
  }

  @Post()
  @Permissions('spaces:create')
  @ResponseMeta({ message: 'spaces.created', statusCode: 201 })
  public async create(@Body() dto: CreateSpaceDto) {
    return this.spacesService.create({ dto });
  }

  @Put(':spaceId')
  @Permissions('spaces:update')
  @ResponseMeta({ message: 'spaces.updated' })
  public async update(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @Body() dto: UpdateSpaceDto,
  ) {
    return this.spacesService.update({ spaceId, dto });
  }

  @Delete(':spaceId')
  @Permissions('spaces:delete')
  @ResponseMeta({ message: 'spaces.deleted' })
  public async delete(@Param('spaceId', ValidateObjectIdPipe) spaceId: string) {
    return this.spacesService.delete({ spaceId });
  }
}
