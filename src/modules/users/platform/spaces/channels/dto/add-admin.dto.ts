import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { SpaceMemberPermission } from '../../../../../../common/types/enums';

export class AddAdminDto {
  @IsOptional()
  @IsString()
  adminTag?: string;

  @IsNotEmpty()
  @IsMongoId()
  memberId: string;

  @IsArray()
  @IsEnum(SpaceMemberPermission, { each: true })
  permissions: SpaceMemberPermission[];
}
