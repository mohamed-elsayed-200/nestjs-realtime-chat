import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { ValidateObjectIdPipe } from '../../../../common/pipes/validate-objectId.pipe';
import { UsersService } from './users.service';
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from '../../../../common/decorators/get-user.decorator';

@Controller('/admin/users')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get()
  @ResponseMeta({ message: 'users.foundAll' })
  public async getAll(@Query() query: QueryDto) {
    return this.usersService.getAll({ query });
  }

  @Get('/:userId')
  @ResponseMeta({ message: 'users.foundOne' })
  public async getOne(
    @Param('userId', ValidateObjectIdPipe)
    userId: ValidateObjectIdPipe,
  ) {
    return this.usersService.getOne({ userId });
  }

  @Post()
  @ResponseMeta({ message: 'users.updated' })
  public async createUser(
    @GetUser('_id') authAdminId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createUser({ authAdminId, dto });
  }

  @Put('/:userId')
  @ResponseMeta({ message: 'users.updated' })
  public async updateUser(
    @Param('userId', ValidateObjectIdPipe)
    userId: ValidateObjectIdPipe,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser({ userId, dto });
  }
}
