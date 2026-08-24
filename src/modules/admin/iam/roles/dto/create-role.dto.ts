import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';
import {
  ActivationStatus,
  AdminPermissionsPlatform,
} from '../../../../../common/types/enums';

export class CreateRoleDto {
  @IsString({ message: 'roles.validation.name.isString' })
  @IsNotEmpty({ message: 'roles.validation.name.isNotEmpty' })
  name: string;

  @IsOptional()
  @IsArray({ message: 'roles.validation.permissions.isArray' })
  @IsEnum(AdminPermissionsPlatform, {
    each: true,
    message: 'roles.validation.permissions.isEnumEach',
  })
  permissions?: AdminPermissionsPlatform[];

  @IsOptional()
  @IsEnum({}, { message: 'roles.validation.status.isEnum' })
  status?: ActivationStatus;
}
