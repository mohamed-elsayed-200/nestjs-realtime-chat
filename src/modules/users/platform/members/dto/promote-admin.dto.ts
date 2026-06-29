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
  @IsOptional()
  @IsString()
  adminTag?: string;

  @IsOptional()
  @IsString()
  adminTagColor?: string;

  @IsNotEmpty()
  @IsMongoId()
  member: string;

  @IsNotEmpty()
  @IsMongoId()
  space: string;

  @IsArray()
  @IsEnum(SpaceMemberPermission, { each: true })
  permissions: SpaceMemberPermission[];
}
