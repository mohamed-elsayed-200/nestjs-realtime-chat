import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { OtpTypes } from '../../../../common/types/enums';

export class SendOtpDto {
  @IsEmail({}, { message: 'auth.validation.email.invalid' })
  @IsNotEmpty({ message: 'auth.validation.email.isNotEmpty' })
  email: string;

  @IsEnum(OtpTypes, { message: 'auth.validation.typeSend.isEnum' })
  typeSend: OtpTypes;
}
