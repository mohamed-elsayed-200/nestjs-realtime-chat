import {
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  ValidateNested,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OptionalLocalizedStringDto } from './localized-string.dto';

export class AddressDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => OptionalLocalizedStringDto)
  country?: OptionalLocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptionalLocalizedStringDto)
  state?: OptionalLocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptionalLocalizedStringDto)
  city?: OptionalLocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptionalLocalizedStringDto)
  area?: OptionalLocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptionalLocalizedStringDto)
  street?: OptionalLocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptionalLocalizedStringDto)
  address?: OptionalLocalizedStringDto;

  @IsOptional()
  @IsString({ message: 'addresses.validation.postalCode.isString' })
  postalCode?: string;

  @IsOptional()
  @IsEnum(['main', 'collection', 'work', 'home', 'billing', 'shipping', 'other'], {
    message: 'addresses.validation.addressType.invalid',
  })
  addressType?: string = 'main';

  @IsOptional()
  @IsBoolean({ message: 'addresses.validation.isActive.isBoolean' })
  isActive?: boolean = true;

  @IsOptional()
  @IsBoolean({ message: 'addresses.validation.isPrimary.isBoolean' })
  isPrimary?: boolean = false;

  @IsOptional()
  @IsString({ message: 'addresses.validation.notes.isString' })
  @MaxLength(500, { message: 'addresses.validation.notes.maxLength' })
  notes?: string;

  @IsOptional()
  @IsNumber({}, { message: 'addresses.validation.latitude.isNumber' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'addresses.validation.longitude.isNumber' })
  longitude?: number;
}
