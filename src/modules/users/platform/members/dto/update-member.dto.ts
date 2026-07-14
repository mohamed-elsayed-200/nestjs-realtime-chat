import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  SpaceMemberPermission,
  SpaceMemberRole,
} from '../../../../../common/types/enums';

export class UpdateMemberDto {
  @IsMongoId()
  @IsNotEmpty()
  space: string;

  @IsOptional()
  @IsEnum(SpaceMemberRole)
  role?: SpaceMemberRole;

  @IsOptional()
  @IsArray()
  @IsEnum(SpaceMemberPermission, { each: true })
  permissions?: SpaceMemberPermission[];

  @IsOptional()
  @IsString()
  adminTag?: string;

  @IsOptional()
  @IsString()
  adminTagColor?: string;
}
