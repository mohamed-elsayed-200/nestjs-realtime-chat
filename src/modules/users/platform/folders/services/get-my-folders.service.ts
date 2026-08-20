import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { FoldersRepository } from '../../../../../common/modules/platform/folders/folders.repository';

@Injectable()
export class GetMyFoldersService {
  constructor(private readonly foldersRepository: FoldersRepository) {}

  public async get({ authUser }) {
    return this.foldersRepository.findMany({
      query: { createdBy: new Types.ObjectId(authUser._id) },
    });
  }
}
