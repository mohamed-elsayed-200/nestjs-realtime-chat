import { IsEnum, IsNotEmpty } from 'class-validator';
import { ActivationStatus } from '../../../../../common/types/enums';

export class UpdateSpaceDto {
  @IsNotEmpty()
  @IsEnum(ActivationStatus, { message: 'user.validation.status.isEnum' })
  status: ActivationStatus;
}
