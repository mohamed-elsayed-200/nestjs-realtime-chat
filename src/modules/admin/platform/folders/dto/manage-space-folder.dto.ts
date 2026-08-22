import { IsString } from 'class-validator';

export class ManageSpaceFolderDto {
  @IsString()
  folderId: string;

  @IsString()
  spaceId: string;
}
