import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { Otp, OtpSchema } from './otp.schema';
import { BaseMailModule } from '../mail/mail.module';
import { BaseUsersModule } from '../iam/users/users.module';
import { BaseTokenModule } from '../token/token.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
    BaseMailModule,
    BaseUsersModule,
    BaseTokenModule,
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class BaseOtpModule {}
