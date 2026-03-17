import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LocalizedStringDto {
  @IsString({ message: 'staffs.validation.name.en.isString' })
  @IsNotEmpty({ message: 'staffs.validation.name.en.isNotEmpty' })
  en: string;

  @IsString({ message: 'staffs.validation.name.ar.isString' })
  @IsNotEmpty({ message: 'staffs.validation.name.ar.isNotEmpty' })
  ar: string;
}

export class OptionalLocalizedStringDto {
  @IsOptional()
  @IsString({ message: 'staffs.validation.name.en.isString' })
  en?: string;

  @IsOptional()
  @IsString({ message: 'staffs.validation.name.ar.isString' })
  ar?: string;
}
