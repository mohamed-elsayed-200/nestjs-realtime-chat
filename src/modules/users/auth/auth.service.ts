import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
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

  public async register({ dto }) {
    const data = await this.authRepository.register({
      ...dto,
      userType: UserType.USER,
    });
    if (!data) throw new InternalServerErrorException('auth.failedRegister');

    return data;
  }

  public async login({ ip, userAgent, res, dto }) {
    const { email, password } = dto;

    const userData = await this.authRepository.login({
      ip,
      email,
      password,
      userAgent,
      userType: UserType.USER,
      res,
    });

    if (userData?.status === UserStatus.NOT_VERIFIED || userData?.is2FA) {
      return this.authRepository.sendOtp({
        email: userData?.email,
        typeSend: OtpTypes.ACCOUNT_VERIFICATION,
      });
    } else {
      return {
        token: userData?.token,
        id: userData?.id,
        name: userData?.name,
        email: userData?.email,
        userType: userData?.userType,
        status: userData?.status,
        bio: userData?.bio,
        profileColor: userData?.profileColor,
        is2FA: userData?.is2FA,
        username: userData?.username,
        avatar: userData?.avatar,
        lastLoginAt: userData?.lastLoginAt,
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
      query: {
        email,
        userType: UserType.USER,
        status: {
          $nin: [UserStatus.BLOCKED, UserStatus.DELETED],
        },
      },
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

  public async verifyToken({ ip, token }) {
    const user = await this.authRepository.verifyToken({
      ip,
      token,
    });
    if (!user) throw new UnauthorizedException('auth.invalidToken');
    return {
      token: user?.token,
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        userType: user?.userType,
        status: user?.status,
        bio: user?.bio,
        profileColor: user?.profileColor,
        is2FA: user?.is2FA,
        username: user?.username,
        avatar: user?.avatar,
        lastLoginAt: user?.lastLoginAt,
      },
    };
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
