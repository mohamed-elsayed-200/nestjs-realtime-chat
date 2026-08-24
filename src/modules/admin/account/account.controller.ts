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
import { VerifyPasscodeDto } from './dto/verify-passcode.dto';

@Controller('/admins/account')
@UseGuards(AuthGuard, UserTypeGuard)
@UserTypes(UserType.ADMIN, UserType.STAFF)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}
  @Get()
  @ResponseMeta({
    message: 'account.found',
  })
  public async findMyAccount(@GetUser('_id') authAdminId: string) {
    return this.accountService.findMyAccount({ authAdminId });
  }

  @Put('/change-password')
  @ResponseMeta({
    message: 'account.updatedPassword',
  })
  public async updatePassword(
    @GetUser('_id') authAdminId: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.accountService.changePassword({ authAdminId, dto });
  }

  @Put('/change-information')
  @ResponseMeta({
    message: 'account.updatedInformation',
  })
  public async changeInformation(
    @GetUser('_id') authAdminId: string,
    @Body() dto: ChangeInformationDto,
  ) {
    return this.accountService.changeInfo({ authAdminId, dto });
  }

  @Post('/verify-passcode')
  @ResponseMeta({
    message: 'account.updatedInformation',
  })
  public async verifyPasscode(
    @GetUser('_id') authAdminId: string,
    @Body() dto: VerifyPasscodeDto,
  ) {
    return this.accountService.verifyPasscode({ authAdminId, dto });
  }
}
