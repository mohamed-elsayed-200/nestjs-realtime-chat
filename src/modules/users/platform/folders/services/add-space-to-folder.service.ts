import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { FoldersRepository } from '../../../../../common/modules/platform/folders/folders.repository';

@Injectable()
export class AddSpaceToFolderService {
  constructor(private readonly foldersRepository: FoldersRepository) {}

  public async addSpaceToFolder({ dto, authUser }) {
    const spaceObjectid = new Types.ObjectId(dto?.spaceId);
    const folderObjectid = new Types.ObjectId(dto?.folderId);

    const folder = await this.foldersRepository.findOne({
      query: { _id: folderObjectid },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.createdBy?.toString() !== authUser._id.toString()) {
      throw new BadRequestException('Not your folder');
    }

    const spaceObjectId = new Types.ObjectId(spaceObjectid);
    const currentSpaces = (folder.spaces ?? []).map(
      (s: any) => s._id?.toString?.() ?? s.toString(),
    );

    if (currentSpaces.includes(spaceObjectid?.toString())) {
      return folder;
    }

    const updated = await this.foldersRepository.updateOne({
      query: { _id: new Types.ObjectId(folderObjectid) },
      dto: { $push: { spaces: spaceObjectId } },
    });

    return updated;
  }
}
