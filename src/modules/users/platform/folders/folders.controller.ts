import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { FoldersService } from './folders.service';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../common/decorators/get-user.decorator';

@Controller('/users/folders')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  @ResponseMeta({ message: 'folders.foundAll' })
  public async getAll(@Query() query: QueryDto, @GetUser() authUser: any) {
    return this.foldersService.getAll({ query, authUser });
  }

  @Get('/:folderId')
  @ResponseMeta({ message: 'folders.foundOne' })
  public async getOne(
    @Param('folderId', ValidateObjectIdPipe) folderId: string,
    @GetUser() authUser: any,
  ) {
    return this.foldersService.getOne({ folderId, authUser });
  }

  @Post()
  @ResponseMeta({ message: 'folders.created' })
  public async create(@Body() dto: any, @GetUser() authUser: any) {
    return this.foldersService.create({ dto, authUser });
  }

  @Put('/:folderId')
  @ResponseMeta({ message: 'folders.updated' })
  public async update(
    @Param('folderId', ValidateObjectIdPipe) folderId: string,
    @Body() dto: any,
    @GetUser() authUser: any,
  ) {
    return this.foldersService.update({ folderId, dto, authUser });
  }

  @Delete('/:folderId')
  @ResponseMeta({ message: 'folders.deleted' })
  public async delete(
    @Param('folderId', ValidateObjectIdPipe) folderId: string,
    @GetUser() authUser: any,
  ) {
    return this.foldersService.delete({ folderId, authUser });
  }
}
