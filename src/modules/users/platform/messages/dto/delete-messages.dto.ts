import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class DeleteMessageDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  messageIds: Types.ObjectId[];

  @IsMongoId()
  @IsNotEmpty()
  spaceId: string;
}
