import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { SpaceMemberPermission } from '../../../../../../common/types/enums';

export class UpdateMemberPermissionsDto {
  @IsMongoId()
  @IsNotEmpty()
  member: string;

  @IsMongoId()
  @IsNotEmpty()
  space: string;

  @IsOptional()
  @IsArray()
  @IsEnum(SpaceMemberPermission, { each: true })
  permissions?: SpaceMemberPermission[];
}
