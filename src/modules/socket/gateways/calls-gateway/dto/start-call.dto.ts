// dto/start-call.dto.ts
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { CallScope, CallType } from '../../../../../common/types/enums';

export class StartCallDto {
  @IsMongoId()
  space: string;

  @IsEnum(CallScope)
  @IsOptional()
  scope?: CallScope = CallScope.PRIVATE;

  @IsEnum(CallType)
  @IsOptional()
  type?: CallType = CallType.AUDIO;

  // Required only for PRIVATE calls
  @ValidateIf((o) => o.scope === CallScope.PRIVATE || !o.scope)
  @IsMongoId()
  receiver?: string;

  @IsMongoId()
  @IsOptional()
  receiverMemberId?: string;

  // Used for group / channel / community calls
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  participantIds?: string[];

  @IsBoolean()
  @IsOptional()
  isConference?: boolean;

  @IsBoolean()
  @IsOptional()
  isBroadcast?: boolean;

  @IsNumber()
  @IsOptional()
  maxParticipants?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
