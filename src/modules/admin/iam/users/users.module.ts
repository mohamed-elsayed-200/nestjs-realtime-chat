import { Module } from '@nestjs/common';
import { BaseAuthModule } from '../../../../common/modules/auth/auth.module';
import { UsersController } from './users.controller';
import { CreateUserService } from './service/create-user.service';
import { GetSingleUserService } from './service/get-single-user.service';
import { GetUsersService } from './service/get-users.service';
import { UpdateUserService } from './service/update-user.service';

@Module({
  imports: [BaseAuthModule],
  controllers: [UsersController],
  providers: [
    CreateUserService,
    GetSingleUserService,
    GetUsersService,
    UpdateUserService,
  ],
  exports: [
    CreateUserService,
    GetSingleUserService,
    GetUsersService,
    UpdateUserService,
  ],
})
export class UsersModule {}
