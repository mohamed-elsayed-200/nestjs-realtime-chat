import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FoldersRepository } from '../../../../../common/modules/platform/folders/folders.repository';

@Injectable()
export class UpdateFolderService {
  constructor(private readonly foldersRepository: FoldersRepository) {}

  public async update({ folderId, dto, authUser }) {
    const updateFolder = await this.foldersRepository.updateOne({
      query: { _id: folderId, createdBy: authUser._id },
      dto: {
        ...dto,
        createdBy: authUser._id,
      },
    });
    if (!updateFolder) throw new NotFoundException('folders.notFound');
    return updateFolder;
  }
}
