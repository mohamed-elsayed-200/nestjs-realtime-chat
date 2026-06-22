import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../../common/decorators/response.decorator';
import { UserTypeGuard } from '../../../../../common/guards/user-type.guard';
import { UserType } from '../../../../../common/types/enums';
import { UserTypes } from '../../../../../common/decorators/user-type.decorator';
import { GetUser } from '../../../../../common/decorators/get-user.decorator';
import { CreateGroupSpaceDto } from './dto/create-group.dto';
import { GroupsService } from './groups.service';

@Controller('/users/spaces/group')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}
  @Post()
  @ResponseMeta({ message: 'spaces.created', statusCode: 201 })
  public async createGroup(
    @Body() dto: CreateGroupSpaceDto,
    @GetUser() authUser: any,
  ) {
    return this.groupsService.createGroup({ dto, authUser });
  }
}
