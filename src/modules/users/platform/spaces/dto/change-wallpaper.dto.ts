import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ChangeWallpaperDto {
  @IsString()
  @IsNotEmpty()
  wallpaper: string;

  @IsBoolean()
  @IsNotEmpty()
  everybody: boolean;
}
