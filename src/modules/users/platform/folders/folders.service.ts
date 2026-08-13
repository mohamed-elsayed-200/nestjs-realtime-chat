import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { FoldersRepository } from '../../../../common/modules/platform/folders/folders.repository';

@Injectable()
export class FoldersService {
  constructor(private readonly foldersRepository: FoldersRepository) {}

  public async getAll({ authUser }) {
    return this.foldersRepository.findMany({
      query: { createdBy: new Types.ObjectId(authUser._id) },
    });
  }

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

  public async delete({ folderId, authUser }) {
    const deleteFolder = await this.foldersRepository.deleteOne({
      query: { _id: folderId, createdBy: authUser._id },
    });
    if (!deleteFolder) throw new NotFoundException('folders.notDeleted');
    return deleteFolder;
  }

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

  public async removeSpaceFromFolder({ dto, authUser }) {
    const spaceObjectid = new Types.ObjectId(dto?.spaceId);
    const folderObjectid = new Types.ObjectId(dto?.folderId);

    const folder = await this.foldersRepository.findOne({
      query: {
        _id: new Types.ObjectId(folderObjectid),
      },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.createdBy?.toString() !== authUser._id.toString()) {
      throw new BadRequestException('Not your folder');
    }

    const updated = await this.foldersRepository.updateOne({
      query: { _id: new Types.ObjectId(folderObjectid) },
      dto: { $pull: { spaces: new Types.ObjectId(spaceObjectid) } },
    });

    return updated;
  }
}
