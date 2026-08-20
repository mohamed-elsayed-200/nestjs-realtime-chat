import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { FoldersController } from './folders.controller';
import { BaseFoldersModule } from '../../../../common/modules/platform/folders/folders.module';
import { AddSpaceToFolderService } from './services/add-space-to-folder.service';
import { CreateFolderService } from './services/create-folder.service';
import { DeleteFolderService } from './services/delete-folder.service';
import { GetMyFoldersService } from './services/get-my-folders.service';
import { RemoveSpaceFromFolderService } from './services/remove-space-from-folder.service';
import { UpdateFolderService } from './services/update-folder.service';

@Module({
  imports: [BaseAuthModule, BaseFoldersModule],
  controllers: [FoldersController],
  providers: [
    AddSpaceToFolderService,
    CreateFolderService,
    DeleteFolderService,
    GetMyFoldersService,
    RemoveSpaceFromFolderService,
    UpdateFolderService,
  ],
  exports: [
    AddSpaceToFolderService,
    CreateFolderService,
    DeleteFolderService,
    GetMyFoldersService,
    RemoveSpaceFromFolderService,
    UpdateFolderService,
  ],
})
export class FoldersModule {}
