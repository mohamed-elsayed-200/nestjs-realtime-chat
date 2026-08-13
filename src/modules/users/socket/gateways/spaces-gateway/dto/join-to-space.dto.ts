import { IsMongoId, IsNotEmpty } from 'class-validator';

export class JoinToSpaceDto {
  @IsNotEmpty()
  @IsMongoId()
  spaceId: string;
}
