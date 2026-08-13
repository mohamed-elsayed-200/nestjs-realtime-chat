import { IsMongoId, IsNotEmpty } from 'class-validator';

export class LeaveFromSpaceDto {
  @IsNotEmpty()
  @IsMongoId()
  spaceId: string;
}
