import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ActivationStatus } from '../../../../../common/types/enums';

export class CreateRoleDto {
  @IsString({ message: 'roles.validation.name.isString' })
  @IsNotEmpty({ message: 'roles.validation.name.isNotEmpty' })
  name: string;

  @IsOptional()
  @IsArray({ message: 'roles.validation.permissions.isArray' })
  @IsMongoId({
    each: true,
    message: 'roles.validation.permissions.isMongoIdEach',
  })
  permissions?: string[];

  @IsOptional()
  @IsEnum({}, { message: 'roles.validation.status.isEnum' })
  status?: ActivationStatus;
}
