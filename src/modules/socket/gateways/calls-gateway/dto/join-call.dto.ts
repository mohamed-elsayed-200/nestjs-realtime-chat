// dto/join-call.dto.ts
import { IsMongoId } from 'class-validator';

export class JoinCallDto {
  @IsMongoId()
  callId: string;
}
