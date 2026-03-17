import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [BaseAuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
