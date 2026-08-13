// dto/reject-call.dto.ts
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class RejectCallDto {
  @IsMongoId()
  callId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
