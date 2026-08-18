import { ChangeInformationDto } from './dto/change-information.dto';
import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { UserTypeGuard } from '../../../common/guards/user-type.guard';
import { UserType } from '../../../common/types/enums';
import { AccountService } from './account.service';
import { ResponseMeta } from '../../../common/decorators/response.decorator';
import { UserTypes } from '../../../common/decorators/user-type.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('/users/account')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.USER)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}
  @Get()
  @ResponseMeta({
    message: 'account.found',
  })
  public async findMyAccount(@GetUser('_id') authUserId: string) {
    return this.accountService.findMyAccount({ authUserId });
  }

  @Put('/change-password')
  @ResponseMeta({
    message: 'account.updatedPassword',
  })
  public async updatePassword(
    @GetUser('_id') authUserId: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.accountService.changePassword({ authUserId, dto });
  }

  @Put('/change-information')
  @ResponseMeta({
    message: 'account.updatedInformation',
  })
  public async changeInformation(
    @GetUser('_id') authUserId: string,
    @Body() dto: ChangeInformationDto,
  ) {
    return this.accountService.changeInfo({ authUserId, dto });
  }

  @Post('/verify-passcode')
  @ResponseMeta({
    message: 'account.updatedInformation',
  })
  public async verifyPasscode(
    @GetUser('_id') authUserId: string,
    @Body() dto: ChangeInformationDto,
  ) {
    return this.accountService.verifyPasscode({ authUserId, dto });
  }
}
