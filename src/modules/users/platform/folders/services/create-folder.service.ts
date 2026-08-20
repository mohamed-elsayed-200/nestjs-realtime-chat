import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FoldersRepository } from '../../../../../common/modules/platform/folders/folders.repository';

@Injectable()
export class CreateFolderService {
  constructor(private readonly foldersRepository: FoldersRepository) {}

  public async create({ dto, authUser }) {
    const newFolder = await this.foldersRepository.createOne({
      dto: {
        ...dto,
        createdBy: authUser._id,
      },
    });
    if (!newFolder)
      throw new InternalServerErrorException('folders.notCreated');
    return newFolder;
  }
}
