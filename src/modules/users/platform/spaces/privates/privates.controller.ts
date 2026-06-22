import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../../common/decorators/response.decorator';
import { UserTypeGuard } from '../../../../../common/guards/user-type.guard';
import { UserType } from '../../../../../common/types/enums';
import { UserTypes } from '../../../../../common/decorators/user-type.decorator';
import { GetUser } from '../../../../../common/decorators/get-user.decorator';
import { CreatePrivateSpaceDto } from './dto/create-private-space.dto';
import { PrivatesService } from './privates.service';

@Controller('/users/spaces/private')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class PrivatesController {
  constructor(private readonly privatesService: PrivatesService) {}

  @Post()
  @ResponseMeta({ message: 'spaces.created', statusCode: 201 })
  public async createPrivate(
    @Body() dto: CreatePrivateSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.privatesService.createPrivate({ dto, authUser });
  }
}
