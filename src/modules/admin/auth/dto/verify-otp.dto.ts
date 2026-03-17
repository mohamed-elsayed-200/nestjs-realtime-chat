import { IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'auth.validation.otpId.isNotEmpty' })
  otpId: string;

  @IsNotEmpty({ message: 'auth.validation.otpCode.isNotEmpty' })
  otpCode: string;
}
