import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { GroupSettingsDto } from '../create-group/group-settings.dto';
import { Type } from 'class-transformer';

export class SpaceSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GroupSettingsDto)
  group?: GroupSettingsDto;
}

export class CreatePrivateSpaceDto {
  @IsNotEmpty({ message: 'categories.validation.memberId.isNotEmpty' })
  @IsMongoId({ message: 'categories.validation.memberId.isMongoId' })
  memberId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpaceSettingsDto)
  settings?: Partial<SpaceSettingsDto>;
}
