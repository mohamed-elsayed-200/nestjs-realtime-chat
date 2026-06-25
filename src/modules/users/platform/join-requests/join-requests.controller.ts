import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { JoinRequestsService } from './join-requests.service';

@Controller('/users/join-requests')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class JoinRequestsController {
  constructor(private readonly joinRequestsService: JoinRequestsService) {}
}
