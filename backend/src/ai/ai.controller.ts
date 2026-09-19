import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { PetDescriptionService } from './pet-description.service';
import { GeneratePetDescriptionDto } from './dto/generate-pet-description.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly petDescription: PetDescriptionService) {}

  @Post('pet-description')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESCATISTA, Role.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async generatePetDescription(
    @Body() dto: GeneratePetDescriptionDto,
  ): Promise<{ description: string }> {
    const description = await this.petDescription.generate(dto);
    return { description };
  }
}
