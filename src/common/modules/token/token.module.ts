import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TokenService } from './token.service';

@Module({
  imports: [JwtModule, ConfigModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class BaseTokenModule {}
