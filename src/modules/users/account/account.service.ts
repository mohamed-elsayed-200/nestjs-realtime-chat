import { UsersRepository } from '../../../common/modules/iam/users/users.repository';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../../../common/types/enums';
import { SpacesRepository } from 'src/common/modules/platform/spaces/spaces.repository';
import { Types } from 'mongoose';

@Injectable()
export class AccountService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly spacesRepository: SpacesRepository,
  ) {}

  public async findMyAccount({ authUserId }) {
    const account = await this.usersRepository.findOne({
      query: { _id: authUserId, status: UserStatus.ACTIVE },
      select: '+email +phone',
    });
    return account;
  }

  public async changeInfo({ authUserId, dto }) {
    const user = await this.usersRepository.updateOne({
      query: { _id: authUserId },
      dto,
    });

    const space = await this.spacesRepository.updateMany({
      query: {
        'received._id': new Types.ObjectId(authUserId),
      },
      dto: {
        received: {
          _id: new Types.ObjectId(authUserId),
          ...dto,
        },
      },
    });
    return user;
  }

  public async changePassword({ authUserId, dto }) {
    const { newPassword, oldPassword } = dto;

    const user = await this.usersRepository.findOne({
      query: { _id: authUserId },
    });
    if (!user) throw new NotFoundException('account.failedUpdatedPassword');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('auth.invalidOldPassword');

    const updatePassword = await this.usersRepository.updateOne({
      query: { _id: authUserId },
      dto: { password: newPassword },
    });
    if (!updatePassword) throw new BadRequestException('common.failed');
  }
}
