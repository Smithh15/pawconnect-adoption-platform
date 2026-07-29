import { IsOptional, IsString, MinLength } from 'class-validator';
import { RegisterDto } from './register.dto';

export class RegisterRescuerDto extends RegisterDto {
  @IsOptional()
  @IsString()
  organizationName?: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;
}
