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

  // get all folders
  public async getAll({ query, authUser }) {
    return this.foldersRepository.findAll({
      query,
      options: {
        allowedSearchFields: ['name'],
        pipelines: [
          {
            $match: {
              user: new Types.ObjectId(authUser._id),
            },
          },
        ],
      },
    });
  }

  // get folder by id
  public async getOne({ folderId, authUser }) {
    const findFolder = await this.foldersRepository.findOne({
      query: { _id: folderId, user: authUser._id },
    });

    if (!findFolder) throw new NotFoundException('folders.notFound');

    return findFolder;
  }

  // create folder
  public async create({ dto, authUser }) {
    const newFolder = await this.foldersRepository.createOne({
      dto: {
        ...dto,
        user: authUser._id,
      },
    });
    if (!newFolder)
      throw new InternalServerErrorException('folders.notCreated');
    return newFolder;
  }

  // update folder
  public async update({ folderId, dto, authUser }) {
    const updateFolder = await this.foldersRepository.updateOne({
      query: { _id: folderId, user: authUser._id },
      dto: {
        ...dto,
        user: authUser._id,
      },
    });
    if (!updateFolder) throw new NotFoundException('folders.notFound');
    return updateFolder;
  }

  // delete folder
  public async delete({ folderId, authUser }) {
    const deleteFolder = await this.foldersRepository.deleteOne({
      query: { _id: folderId, user: authUser._id },
    });
    if (!deleteFolder) throw new NotFoundException('folders.notDeleted');
    return deleteFolder;
  }
}
