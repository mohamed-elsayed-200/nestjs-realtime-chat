// dto/join-call.dto.ts
import { IsMongoId, IsString } from 'class-validator';

export class JoinCallDto {
  @IsMongoId()
  callId: string;

  @IsString()
  password?: string;
}
