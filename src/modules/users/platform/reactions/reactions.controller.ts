import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { PermissionsGuard } from '../../../../common/guards/permissions-guard.guard';
import { AuthGuard } from '../../../../common/guards/auth.guard';
import { ResponseMeta } from '../../../../common/decorators/response.decorator';
import { UserTypeGuard } from '../../../../common/guards/user-type.guard';
import { UserType } from '../../../../common/types/enums';
import { UserTypes } from '../../../../common/decorators/user-type.decorator';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { ToggleReactionCommentDto } from './dto/toggle-reaction-comment.dto';

@Controller('/users/reactions')
@UseGuards(AuthGuard, PermissionsGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post('toggle-comment')
  @ResponseMeta({ message: 'reactions.toggled' })
  public async toggleReactionComment(
    @GetUser() authUser: any,
    @Body() dto: ToggleReactionCommentDto,
  ) {
    return this.reactionsService.toggleReactionComment({ dto, authUser });
  }
}
