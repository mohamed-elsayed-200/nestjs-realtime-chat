import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { BaseFoldersModule } from '../../../../common/modules/platform/folders/folders.module';

@Module({
  imports: [BaseAuthModule, BaseFoldersModule],
  controllers: [FoldersController],
  providers: [FoldersService],
})
export class FoldersModule {}
