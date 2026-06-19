import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthRepository } from '../../../common/modules/auth/auth.repository';
import { UsersRepository } from '../../../common/modules/iam/users/users.repository';
import { OtpService } from '../../../common/modules/otp/otp.service';
import { OtpTypes, UserStatus, UserType } from '../../../common/types/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    private readonly otpService: OtpService,
  ) {}

  public async login({ ip, userAgent, dto }) {
    const { email, password } = dto;

    const userData = await this.authRepository.login({
      ip,
      email,
      password,
      userAgent,
      userType: UserType.ADMIN,
    });

    if (userData?.status === UserStatus.NOT_VERIFIED || userData?.is2FA) {
      return this.authRepository.sendOtp({
        email: userData?.email,
        typeSend: OtpTypes.ACCOUNT_VERIFICATION,
      });
    } else {
      return {
        name: userData?.name,
        email: userData?.email,
        userType: userData?.userType,
        status: userData?.status,
      };
    }
  }

  public async sendOtp({ email, typeSend }) {
    return this.authRepository.sendOtp({
      email: email,
      typeSend: typeSend,
    });
  }

  public async logout({ res, token, userId }) {
    return this.authRepository.logout({
      userId,
      token,
      res,
    });
  }

  public async forgotPassword({ email }) {
    const findUser = await this.usersRepository.findOne({
      query: { email, userType: { $in: [UserType.STAFF, UserType.ADMIN] } },
    });

    if (!findUser) throw new NotFoundException('auth.accountNotFound');
    return this.authRepository.sendOtp({
      email,
      typeSend: OtpTypes.PASSWORD_RECOVERY,
    });
  }

  public async verifyForgotPassword({ otpCode, otpId }) {
    const otpRecord = await this.otpService.verify({ otpCode, otpId });
    if (!otpRecord || !otpRecord.userId)
      throw new BadRequestException('auth.failedOtpVerification');

    const updatedUser = await this.usersRepository.updateOne({
      query: { _id: otpRecord.userId?.toString() },
      dto: { isAllowedChangePassword: true },
    });

    if (!updatedUser)
      throw new BadRequestException('auth.failedOtpVerification');

    return null;
  }

  public async resetPassword({ newPassword, email }) {
    const findUser = await this.usersRepository.findOne({
      query: { email, isAllowedChangePassword: true },
    });
    if (!findUser) throw new BadRequestException('auth.failedUpdatedPassword');

    const updatedPassword = await this.usersRepository.updateOne({
      query: { _id: findUser._id?.toString() },
      dto: {
        password: newPassword,
        isAllowedChangePassword: false,
      },
    });

    if (!updatedPassword)
      throw new BadRequestException('auth.failedUpdatedPassword');

    return null;
  }

  public async verifyAccount({ ip, otpCode, otpId, res, userAgent }) {
    const userData = await this.authRepository.verifyAccount({
      ip,
      otpCode,
      otpId,
      res,
      userAgent,
    });
    return {
      name: userData?.name,
      email: userData?.email,
      userType: userData?.userType,
      status: userData?.status,
      isVerified: true,
    };
  }
}
