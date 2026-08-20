// dto/accept-call.dto.ts
import { IsMongoId } from 'class-validator';

export class AcceptCallDto {
  @IsMongoId()
  callId: string;
}
