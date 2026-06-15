import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class ForwardMessageDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  messageIds: Types.ObjectId[];

  @IsMongoId()
  @IsNotEmpty()
  targetSpaceId: Types.ObjectId;
}
