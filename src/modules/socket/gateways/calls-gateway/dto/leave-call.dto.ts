// dto/leave-call.dto.ts
import { IsMongoId } from 'class-validator';

export class LeaveCallDto {
  @IsMongoId()
  callId: string;
}
