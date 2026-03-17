import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BaseTokenModule } from '../token/token.module';
import { AuthRepository } from './auth.repository';
import { BaseUsersModule } from '../iam/users/users.module';
import { BaseSessionsModule } from '../iam/sessions/sessions.module';
import { BaseMailModule } from '../mail/mail.module';
import { BaseOtpModule } from '../otp/otp.module';

@Module({
  imports: [
    BaseUsersModule,
    ConfigModule,
    BaseMailModule,
    BaseTokenModule,
    BaseOtpModule,
    BaseSessionsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  providers: [AuthRepository],
  exports: [AuthRepository, JwtModule, BaseSessionsModule, BaseUsersModule],
})
export class BaseAuthModule {}
