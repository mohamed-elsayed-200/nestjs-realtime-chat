import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OtpService } from '../otp/otp.service';
import { SessionsRepository } from '../iam/sessions/sessions.repository';
import { UsersRepository } from '../iam/users/users.repository';
import { TokenService } from '../token/token.service';
import { MailService } from '../mail/mail.service';
import { OtpTypes, UserType } from '../../types/enums';
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

  public async login({ ip, email, userAgent, password, userType, res }) {
    const user = await this.usersRepository.findOne({
      query: {
        email,
        userType:
          userType === UserType.STAFF
            ? { $in: [UserType.STAFF, UserType.ADMIN] }
            : userType,
      },
      select: '+password +email',
    });

    if (!user || !user.password)
      throw new UnauthorizedException('auth.invalidCredentials');

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch)
      throw new UnauthorizedException('auth.invalidCredentials');

    // Generate token
    const token = await this.tokenService.generateToken({
      userId: user._id,
    });

    const session = await this.sessionsRepository.createOne({
      dto: {
        user: user._id,
        token,
        userAgent,
        ip,
      },
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('sessionId', session?._id, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return user;
  }

  public async logout({ userId, token, res }) {
    await this.sessionsRepository.updateOne({
      query: { user: userId, token },
      dto: { isActive: false },
    });

    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
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
      dto: { isVerified: true },
    });

    const token = await this.tokenService.generateToken({ userId });

    const session = await this.sessionsRepository.createOne({
      dto: {
        token,
        user: user._id,
        ip,
        userAgent,
      },
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('sessionId', session?._id, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return user;
  }
  public async verifyToken({ ip, token, res }) {
    const decoded = await this.tokenService.verifyToken(token);

    if (!decoded || !decoded.userId) {
      throw new UnauthorizedException('auth.invalidToken');
    }

    const session = await this.sessionsRepository.findOne({
      query: {
        user: decoded.userId,
        ip,
        status: 'active',
      },
    });

    if (!session) {
      throw new UnauthorizedException('auth.sessionExpired');
    }

    const user = await this.usersRepository.findOne({
      query: { _id: decoded.userId },
    });

    if (!user) {
      throw new NotFoundException('auth.userNotFound');
    }

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('sessionId', session?._id, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      user,
      token,
      sessionId: session?._id,
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
