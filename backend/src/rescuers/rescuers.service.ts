import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RescuerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRescuerDto } from './dto/update-rescuer.dto';

const RESCUER_PUBLIC_SELECT = {
  id: true,
  organizationName: true,
  description: true,
  city: true,
  country: true,
  website: true,
  status: true,
  createdAt: true,
  user: {
    select: { id: true, name: true, email: true },
  },
};

@Injectable()
export class RescuersService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const profile = await this.prisma.rescuerProfile.findUnique({
      where: { userId },
      select: {
        ...RESCUER_PUBLIC_SELECT,
        approvedAt: true,
        updatedAt: true,
      },
    });

    if (!profile) throw new NotFoundException('Perfil de rescatista no encontrado');
    return profile;
  }

  async updateMyProfile(userId: string, dto: UpdateRescuerDto) {
    const profile = await this.prisma.rescuerProfile.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (!profile) throw new NotFoundException('Perfil de rescatista no encontrado');

    if (profile.status === RescuerStatus.REJECTED) {
      throw new ForbiddenException('Tu perfil fue rechazado y no puede ser editado');
    }

    const updated = await this.prisma.rescuerProfile.update({
      where: { userId },
      data: {
        ...(dto.organizationName !== undefined && { organizationName: dto.organizationName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.city && { city: dto.city }),
        ...(dto.country && { country: dto.country }),
        ...(dto.website !== undefined && { website: dto.website }),
      },
      select: {
        ...RESCUER_PUBLIC_SELECT,
        approvedAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async getById(id: string) {
    const profile = await this.prisma.rescuerProfile.findUnique({
      where: { id },
      select: {
        ...RESCUER_PUBLIC_SELECT,
        _count: {
          select: { animals: true },
        },
      },
    });

    if (!profile || profile.status !== RescuerStatus.APPROVED) {
      throw new NotFoundException('Rescatista no encontrado');
    }

    return profile;
  }
}
