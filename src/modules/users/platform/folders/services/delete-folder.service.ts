import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FoldersRepository } from '../../../../../common/modules/platform/folders/folders.repository';

@Injectable()
export class DeleteFolderService {
  constructor(private readonly foldersRepository: FoldersRepository) {}

  public async delete({ folderId, authUser }) {
    const deleteFolder = await this.foldersRepository.deleteOne({
      query: { _id: folderId, createdBy: authUser._id },
    });
    if (!deleteFolder) throw new NotFoundException('folders.notDeleted');
    return deleteFolder;
  }
}
