import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SpaceTypes } from 'src/common/types/enums';

export class OpenLinkDto {
  @IsString()
  @IsEnum(SpaceTypes)
  @IsNotEmpty()
  linkType: SpaceTypes;

  @IsString()
  @IsNotEmpty()
  linkText: string;
}
