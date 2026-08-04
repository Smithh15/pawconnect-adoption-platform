import { Injectable } from '@nestjs/common';
import { AnimalStatus, RequestStatus, RescuerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getPublicStats() {
    const [availableAnimals, finalizedAdoptions, approvedRescuers] = await Promise.all([
      this.prisma.animal.count({ where: { status: AnimalStatus.DISPONIBLE } }),
      this.prisma.adoptionRequest.count({ where: { status: RequestStatus.FINALIZADA } }),
      this.prisma.rescuerProfile.count({ where: { status: RescuerStatus.APPROVED } }),
    ]);

    return { availableAnimals, finalizedAdoptions, approvedRescuers };
  }
}
