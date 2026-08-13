import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { FoldersRepository } from '../../../../common/modules/platform/folders/folders.repository';

@Injectable()
export class FoldersService {
  constructor(private readonly foldersRepository: FoldersRepository) {}

  public async getAll({ query, authUser }) {
    return this.foldersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name'],
        pipelines: [
          {
            $match: {
              createdBy: new Types.ObjectId(authUser._id),
            },
          },
        ],
      },
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
}
