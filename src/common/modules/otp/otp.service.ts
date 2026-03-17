import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { Otp } from './otp.schema';
import { UsersRepository } from '../iam/users/users.repository';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly i18n: I18nService,
  ) {}

  public async generate({ email }: { email: string }) {
    const user = await this.usersRepository.findOne({ query: { email } });
    if (!user) {
      throw new UnauthorizedException(this.i18n.t('otp.emailNotRegistered'));
    }

    const userId = user._id.toString();

    const otpLimit = 3;
    const cooldownTime = 60_000;
    const recentOtps = await this.otpModel.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - cooldownTime) },
    });
    if (recentOtps.length >= otpLimit) {
      throw new BadRequestException(this.i18n.t('otp.waitBeforeResend'));
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const otpCount = await this.otpModel.countDocuments({
      userId,
      createdAt: { $gte: oneHourAgo },
    });
    if (otpCount >= 5) {
      throw new ForbiddenException(this.i18n.t('otp.tooManyRequests'));
    }

    const code = this.generateCode();

    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(
      Date.now() +
        Number(this.configService.get<string>('OTP_EXPIRATION_MINUTES', '5')) *
          60 *
          1000,
    );

    await this.otpModel.deleteMany({
      userId,
      createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) },
    });

    const otpCreated = await this.otpModel.create({
      userId,
      code: hashedCode,
      expiresAt,
      attempts: 0,
    });

    return {
      email,
      code,
      username: user.name,
      otpId: otpCreated?._id,
    };
  }

  public async verify({ otpCode, otpId }: { otpCode: string; otpId: string }) {
    const otp = await this.otpModel.findById(otpId);

    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException(this.i18n.t('otp.expired'));
    }

    if (otp.attempts >= 3) {
      throw new ForbiddenException(this.i18n.t('otp.tooManyAttempts'));
    }

    const isMatch = await bcrypt.compare(otpCode, otp.code);

    if (!isMatch) {
      await this.otpModel.findByIdAndUpdate(otpId, { $inc: { attempts: 1 } });
      throw new BadRequestException(this.i18n.t('otp.invalid'));
    }

    const otpObj = await this.otpModel.findByIdAndDelete(otpId);
    return otpObj;
  }

  private generateCode(): string {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
}
