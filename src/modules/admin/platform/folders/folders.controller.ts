import { CreateFolderService } from './services/create-folder.service';
import { AddSpaceToFolderService } from './services/add-space-to-folder.service';
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
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { ManageSpaceFolderDto } from './dto/manage-space-folder.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { GetMyFoldersService } from './services/get-my-folders.service';
import { DeleteFolderService } from './services/delete-folder.service';
import { UpdateFolderService } from './services/update-folder.service';
import { RemoveSpaceFromFolderService } from './services/remove-space-from-folder.service';

@Controller('/admins/folders')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class FoldersController {
  constructor(
    private readonly getMyFoldersService: GetMyFoldersService,
    private readonly addSpaceToFolderService: AddSpaceToFolderService,
    private readonly createFolderService: CreateFolderService,
    private readonly deleteFolderService: DeleteFolderService,
    private readonly updateFolderService: UpdateFolderService,
    private readonly removeSpaceFromFolderService: RemoveSpaceFromFolderService,
  ) {}

  @Get()
  @ResponseMeta({ message: 'folders.foundAll' })
  public async getAll(@GetUser() authUser: any) {
    return this.getMyFoldersService.get({ authUser });
  }

  @Post()
  @ResponseMeta({ message: 'folders.created' })
  public async create(@Body() dto: CreateFolderDto, @GetUser() authUser: any) {
    return this.createFolderService.create({ dto, authUser });
  }

  @Put('/:folderId')
  @ResponseMeta({ message: 'folders.updated' })
  public async update(
    @Param('folderId', ValidateObjectIdPipe) folderId: string,
    @Body() dto: UpdateFolderDto,
    @GetUser() authUser: any,
  ) {
    return this.updateFolderService.update({ folderId, dto, authUser });
  }

  @Delete('/:folderId')
  @ResponseMeta({ message: 'folders.deleted' })
  public async delete(
    @Param('folderId', ValidateObjectIdPipe) folderId: string,
    @GetUser() authUser: any,
  ) {
    return this.deleteFolderService.delete({ folderId, authUser });
  }

  @Post('add-space')
  async addSpace(@Body() dto: ManageSpaceFolderDto, @GetUser() authUser: any) {
    return this.addSpaceToFolderService.add({ dto, authUser });
  }

  @Post('remove-space')
  async removeSpace(
    @Body() dto: ManageSpaceFolderDto,
    @GetUser() authUser: any,
  ) {
    return this.removeSpaceFromFolderService.remove({
      dto,
      authUser,
    });
  }
}
