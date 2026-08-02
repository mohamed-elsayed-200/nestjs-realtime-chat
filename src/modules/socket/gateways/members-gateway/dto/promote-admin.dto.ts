import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { SpaceMemberPermission } from '../../../../../common/types/enums';

export class PromoteAdminDto {
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

  @IsOptional()
  @IsString()
  adminTag?: string;

  @IsOptional()
  @IsString()
  adminTagColor?: string;
}
