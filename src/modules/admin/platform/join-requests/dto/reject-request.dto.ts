import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RejectRequestDto {
  @IsNotEmpty()
  @IsMongoId()
  space: string;

  @IsNotEmpty()
  @IsMongoId()
  request: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
