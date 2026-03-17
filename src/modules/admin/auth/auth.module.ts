import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BaseAuthModule } from '../../../common/modules/auth/auth.module';
import { BaseOtpModule } from '../../../common/modules/otp/otp.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [BaseAuthModule, BaseOtpModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
