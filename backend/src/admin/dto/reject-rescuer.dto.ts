import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectRescuerDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
