import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../../../../common/modules/iam/users/users.repository';
import { Types } from 'mongoose';

@Injectable()
export class DeleteUserService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async delete({ userId }) {
    const userObjectId = new Types.ObjectId(userId);
    const deletedUser = await this.usersRepository.deleteOne({
      query: { _id: userObjectId },
    });

    if (!deletedUser) throw new NotFoundException('users.failedDelete');
    return deletedUser;
  }
}
