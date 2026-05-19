import { UsersRepository } from '../../../common/modules/iam/users/users.repository';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../../../common/types/enums';

@Injectable()
export class AccountService {
  constructor(private readonly usersRepository: UsersRepository) {}

  public async findMyAccount({ authAdminId }) {
    const account = await this.usersRepository.findOne({
      query: { _id: authAdminId, status: UserStatus.ACTIVE },
      select: '+email +phone',
    });
    return account;
  }

  public async changeInfo({ authAdminId, dto }) {
    const user = await this.usersRepository.updateOne({
      query: { _id: authAdminId },
      dto,
    });
    return user;
  }

  public async changePassword({ authAdminId, dto }) {
    const { newPassword, oldPassword } = dto;

    const user = await this.usersRepository.findOne({
      query: { _id: authAdminId },
    });
    if (!user) throw new NotFoundException('account.failedUpdatedPassword');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('auth.invalidOldPassword');

    const updatePassword = await this.usersRepository.updateOne({
      query: { _id: authAdminId },
      dto: { password: newPassword },
    });
    if (!updatePassword) throw new BadRequestException('common.failed');
  }
}
