import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Species, AnimalSize, Gender } from '@prisma/client';

export class CreateAnimalDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsEnum(Species)
  species: Species;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  breed?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ageMonths?: number;

  @IsEnum(AnimalSize)
  size: AnimalSize;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  healthNotes?: string;

  @IsOptional()
  @IsBoolean()
  vaccinated?: boolean;

  @IsOptional()
  @IsBoolean()
  sterilized?: boolean;
}
