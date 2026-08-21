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
import { QueryDto } from '../../../../common/modules/dto/query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { UpdateUserService } from './service/update-user.service';
import { GetUsersService } from './service/get-users.service';
import { GetSingleUserService } from './service/get-single-user.service';
import { CreateUserService } from './service/create-user.service';

@Controller('/admins/users')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class UsersController {
  constructor(
    private readonly createUserService: CreateUserService,
    private readonly getSingleUserService: GetSingleUserService,
    private readonly getUsersService: GetUsersService,
    private readonly updateUserService: UpdateUserService,
  ) {}
  @Get()
  @ResponseMeta({ message: 'users.foundAll' })
  public async getAll(@Query() query: QueryDto) {
    return this.getUsersService.get({ query });
  }

  @Get('/:userId')
  @ResponseMeta({ message: 'users.foundOne' })
  public async getOne(
    @Param('userId', ValidateObjectIdPipe)
    userId: ValidateObjectIdPipe,
  ) {
    return this.getSingleUserService.get({ userId });
  }

  @Post()
  @ResponseMeta({ message: 'users.updated' })
  public async createUser(
    @GetUser('_id') authAdminId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.createUserService.create({ authAdminId, dto });
  }

  @Put('/:userId')
  @ResponseMeta({ message: 'users.updated' })
  public async updateUser(
    @Param('userId', ValidateObjectIdPipe)
    userId: ValidateObjectIdPipe,
    @Body() dto: UpdateUserDto,
  ) {
    return this.updateUserService.update({ userId, dto });
  }
}
