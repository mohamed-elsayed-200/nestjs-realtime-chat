import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { GetSpacesService } from './services/get-spaces.service';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { QueryGetSpacesDto } from './dto/query-get-spaces.dto';
import { UpdateSpaceService } from './services/update-space.service';
import { DeleteSpaceService } from './services/delete-space.service';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Controller('/admins/spaces')
@UseGuards(AuthGuard, UserTypeGuard)
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class SpacesController {
  constructor(
    private readonly getSpacesService: GetSpacesService,
    private readonly updateSpaceService: UpdateSpaceService,
    private readonly deleteSpaceService: DeleteSpaceService,
  ) {}

  @Get()
  @ResponseMeta({ message: 'spaces.findAll' })
  public async getSpaces(@Query() query: QueryGetSpacesDto) {
    return this.getSpacesService.get({ query });
  }

  @Put('/:spaceId')
  @ResponseMeta({ message: 'spaces.updated' })
  public async updateSpace(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
    @Body() dto: UpdateSpaceDto,
  ) {
    return this.updateSpaceService.update({ spaceId, dto });
  }

  @Put('/:spaceId')
  @ResponseMeta({ message: 'spaces.deleted' })
  public async deleteSpace(
    @Param('spaceId', ValidateObjectIdPipe) spaceId: string,
  ) {
    return this.deleteSpaceService.delete({ spaceId });
  }
}
