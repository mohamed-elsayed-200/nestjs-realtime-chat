// dto/end-call.dto.ts
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class EndCallDto {
  @IsMongoId()
  callId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
