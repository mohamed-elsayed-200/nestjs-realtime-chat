import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class ForwardMessageDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  messages: string[];

  @IsMongoId()
  @IsNotEmpty()
  targetSpace: string;
}
