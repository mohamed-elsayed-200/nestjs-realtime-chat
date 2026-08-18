import { IsString, Matches } from 'class-validator';

const PASSCODE_PATTERN = /^\d{4,8}$/;

export class VerifyPasscodeDto {
  @IsString({ message: 'account.validation.passcode.isString' })
  @Matches(PASSCODE_PATTERN, {
    message: 'account.validation.passcode.pattern',
  })
  passcode: string;
}
