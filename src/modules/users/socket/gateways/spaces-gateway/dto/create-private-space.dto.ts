import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrivateSettingsDto } from './private-space-settings.dto';

export class SpaceSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PrivateSettingsDto)
  private?: PrivateSettingsDto;
}

export class CreatePrivateSpaceDto {
  @IsNotEmpty({ message: 'categories.validation.memberId.isNotEmpty' })
  @IsMongoId({ message: 'categories.validation.memberId.isMongoId' })
  memberId: string;

  // @IsOptional()
  // @ValidateNested()
  // @Type(() => SpaceSettingsDto)
  // settings?: Partial<SpaceSettingsDto>;
}
