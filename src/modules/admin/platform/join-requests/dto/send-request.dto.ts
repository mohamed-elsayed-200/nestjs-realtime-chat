import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendRequestDto {
  @IsOptional()
  @IsString({ message: 'members.validation.bio.isString' })
  message?: string;

  @IsNotEmpty()
  @IsMongoId()
  space: string;
}
