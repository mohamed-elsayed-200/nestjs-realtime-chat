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
    const getAccount = await this.usersRepository.findOne({
      query: { _id: authAdminId, status: UserStatus.ACTIVE },
      select: '+email',
      populate: [
        {
          path: 'roles',
          model: 'Role',
          select: 'name status permissions',
        },
      ],
    });
    return getAccount;
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
      select: '+password',
    });
    if (!user) throw new NotFoundException('account.failedUpdatedPassword');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('auth.invalidOldPassword');

    const updatePassword = await this.usersRepository.updateOne({
      query: { _id: authAdminId },
      dto: { password: newPassword },
    });
    if (!updatePassword) throw new BadRequestException('common.failed');

    return user;
  }

  public async verifyPasscode({ authAdminId, dto }) {
    const { passcode } = dto;

    const user = await this.usersRepository.findOne({
      query: { _id: authAdminId },
      select: '+passcodeLock',
    });
    if (!user) throw new NotFoundException('account.accountNotFound');

    if (!user.isPasscodeLocked || !user.passcodeLock) {
      throw new BadRequestException('account.passcodeNotEnabled');
    }

    const isMatch = await bcrypt.compare(passcode, user.passcodeLock);
    if (!isMatch) throw new BadRequestException('account.invalidPasscode');

    return { valid: true };
  }
}
