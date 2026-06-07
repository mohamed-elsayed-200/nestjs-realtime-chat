import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Folder, FolderSchema } from './folder.schema';
import { FoldersRepository } from './folders.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Folder.name,
        schema: FolderSchema,
      },
    ]),
  ],
  providers: [FoldersRepository],
  exports: [FoldersRepository],
})
export class BaseFoldersModule {}
