import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OtpService } from '../otp/otp.service';
import { SessionsRepository } from '../iam/sessions/sessions.repository';
import { UsersRepository } from '../iam/users/users.repository';
import { TokenService } from '../token/token.service';
import { MailService } from '../mail/mail.service';
import {
  ActivationStatus,
  OtpTypes,
  UserStatus,
  UserType,
} from '../../types/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthRepository {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
  ) {}

  public async register({ email, name, password, ...otherFields }) {
    const findAccount = await this.usersRepository.findOne({
      query: { email },
    });

    if (findAccount) throw new BadRequestException('auth.emailAlreadyInUse');

    await this.usersRepository.createOne({
      dto: {
        email,
        name,
        password,
        ...otherFields,
      },
    });

    const otpData = await this.otpService.generate({ email });

    const sended = await this.mailService.sendAccountVerificationEmail({
      username: otpData.username,
      email: otpData.email,
      otpCode: otpData.code,
    });

    if (!sended) throw new InternalServerErrorException('auth.failedSendOtp');

    return { otpId: otpData.otpId, email };
  }

  public async login({ ip, email, userAgent, password, userType }) {
    const user = await this.usersRepository.findOne({
      query: { email, userType },
      select: '+password +email',
    });

    if (!user || !user.password)
      throw new BadRequestException('auth.invalidCredentials');

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch)
      throw new BadRequestException('auth.invalidCredentials');

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('auth.accountNotActivated');
    }

    const session = await this.sessionsRepository.createOne({
      dto: {
        user: user._id,
        userAgent,
        ip,
        status: ActivationStatus.ACTIVE,
      },
    });

    if (!session) {
      throw new InternalServerErrorException('auth.failedCreateSession');
    }

    const token = await this.tokenService.generateToken({
      userId: user._id,
      sessionId: session?._id,
    });

    await this.sessionsRepository.updateOne({
      query: { _id: session._id },
      dto: { token },
    });

    return { ...user?.toObject(), token };
  }

  public async logout({ userId, token, res }) {
    await this.sessionsRepository.updateOne({
      query: { user: userId, token },
      dto: { isActive: false },
    });

    return true;
  }

  public async verifyAccount({ ip, otpId, userAgent, otpCode, res }) {
    const otpRecord = await this.otpService.verify({ otpId, otpCode });

    if (!otpRecord || !otpRecord.userId) {
      throw new BadRequestException('auth.failedOtpVerification');
    }

    const userId = otpRecord.userId;
    const user = await this.usersRepository.findOne({
      query: { _id: userId },
      select: '+email',
    });

    if (!user) {
      throw new NotFoundException('auth.emailNotRegistered');
    }

    await this.usersRepository.updateOne({
      query: { _id: user._id },
      dto: { status: UserStatus.ACTIVE },
    });

    const session = await this.sessionsRepository.createOne({
      dto: {
        user: user._id,
        ip,
        userAgent,
      },
    });
    if (!session)
      throw new InternalServerErrorException('auth.failedOtpVerification');
    const token = await this.tokenService.generateToken({
      userId,
      sessionId: session?._id,
    });

    return { ...user?.toObject(), token };
  }

  public async verifyToken({ ip, token }) {
    const decoded = await this.tokenService.verifyToken(token);

    if (!decoded || !decoded.userId) {
      throw new BadRequestException('auth.invalidToken');
    }

    const session = await this.sessionsRepository.findOne({
      query: {
        user: decoded.userId,
        ip,
        status: ActivationStatus.ACTIVE,
      },
    });

    if (!session) {
      throw new BadRequestException('auth.sessionExpired');
    }

    const user = await this.usersRepository.findOne({
      query: { _id: decoded.userId, status: UserStatus.ACTIVE },
    });

    if (!user) {
      throw new NotFoundException('auth.invalidToken');
    }

    const newToken = await this.tokenService.generateToken({
      userId: user?._id,
      sessionId: session?._id,
    });

    return {
      ...user?.toObject(),
      id: user?._id,
      token,
      newToken,
    };
  }

  public async sendOtp({ email, typeSend }) {
    const otpRecord = await this.otpService.generate({ email });

    let sended: any = null;
    if (typeSend === OtpTypes.ACCOUNT_VERIFICATION) {
      sended = await this.mailService.sendAccountVerificationEmail({
        username: otpRecord.username,
        email: otpRecord.email,
        otpCode: otpRecord.code,
      });
    }

    if (typeSend === OtpTypes.PASSWORD_RECOVERY) {
      sended = await this.mailService.sendPasswordRecoveryEmail({
        username: otpRecord.username,
        email: otpRecord.email,
        otpCode: otpRecord.code,
      });
    }

    if (!sended) throw new InternalServerErrorException('auth.failedSendOtp');
    return { email, otpId: otpRecord.otpId };
  }
}
