import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateRequestDto {
  @IsUUID()
  animalId: string;

  @IsString()
  @MinLength(30)
  @MaxLength(1000)
  motivation: string;
}
