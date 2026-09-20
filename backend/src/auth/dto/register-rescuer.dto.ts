import { IsOptional, IsString, MaxLength } from 'class-validator';
import { RegisterDto } from './register.dto';

export class RegisterRescuerDto extends RegisterDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  organizationName?: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
