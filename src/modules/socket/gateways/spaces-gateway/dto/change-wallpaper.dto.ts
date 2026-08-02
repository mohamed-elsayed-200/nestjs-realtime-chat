import { IsBoolean, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class ChangeWallpaperDto {
  @IsString()
  @IsNotEmpty()
  wallpaper: string;

  @IsBoolean()
  @IsNotEmpty()
  everybody: boolean;

  @IsNotEmpty()
  @IsMongoId()
  spaceId: string;
}
