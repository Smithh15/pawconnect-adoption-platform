import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationTargetType,
  RescuerStatus,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RejectRescuerDto } from './dto/reject-rescuer.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ── Rescuers ──────────────────────────────────────────────

  async getPendingRescuers() {
    return this.prisma.rescuerProfile.findMany({
      where: { status: RescuerStatus.PENDING },
      select: {
        id: true,
        organizationName: true,
        description: true,
        city: true,
        country: true,
        website: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveRescuer(profileId: string, adminId: string) {
    const profile = await this.prisma.rescuerProfile.findUnique({
      where: { id: profileId },
      select: { id: true, status: true },
    });

    if (!profile) throw new NotFoundException('Perfil de rescatista no encontrado');

    if (profile.status !== RescuerStatus.PENDING) {
      throw new BadRequestException('Solo se pueden aprobar perfiles en estado PENDING');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.rescuerProfile.update({
        where: { id: profileId },
        data: {
          status: RescuerStatus.APPROVED,
          approvedById: adminId,
          approvedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          approvedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.moderationLog.create({
        data: {
          adminId,
          targetType: ModerationTargetType.USER,
          targetId: profileId,
          action: 'APPROVE_RESCUER',
        },
      }),
    ]);

    return updated;
  }

  async rejectRescuer(profileId: string, adminId: string, dto: RejectRescuerDto) {
    const profile = await this.prisma.rescuerProfile.findUnique({
      where: { id: profileId },
      select: { id: true, status: true },
    });

    if (!profile) throw new NotFoundException('Perfil de rescatista no encontrado');

    if (profile.status !== RescuerStatus.PENDING) {
      throw new BadRequestException('Solo se pueden rechazar perfiles en estado PENDING');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.rescuerProfile.update({
        where: { id: profileId },
        data: { status: RescuerStatus.REJECTED },
        select: {
          id: true,
          status: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.moderationLog.create({
        data: {
          adminId,
          targetType: ModerationTargetType.USER,
          targetId: profileId,
          action: 'REJECT_RESCUER',
          notes: dto.notes,
        },
      }),
    ]);

    return updated;
  }

  // ── Users ─────────────────────────────────────────────────

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async suspendUser(userId: string, adminId: string, dto: SuspendUserDto) {
    if (userId === adminId) {
      throw new BadRequestException('No puedes suspenderte a ti mismo');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, role: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('El usuario ya está suspendido');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.SUSPENDED },
        select: { id: true, name: true, email: true, status: true },
      }),
      this.prisma.moderationLog.create({
        data: {
          adminId,
          targetType: ModerationTargetType.USER,
          targetId: userId,
          action: 'SUSPEND_USER',
          notes: dto.notes,
        },
      }),
    ]);

    return updated;
  }

  async activateUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('El usuario ya está activo');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE },
        select: { id: true, name: true, email: true, status: true },
      }),
      this.prisma.moderationLog.create({
        data: {
          adminId,
          targetType: ModerationTargetType.USER,
          targetId: userId,
          action: 'ACTIVATE_USER',
        },
      }),
    ]);

    return updated;
  }

  // ── Stats ─────────────────────────────────────────────────

  async getStats() {
    const [
      totalUsers,
      totalRescuers,
      pendingRescuers,
      totalAnimals,
      availableAnimals,
      adoptedAnimals,
      totalRequests,
      pendingRequests,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.rescuerProfile.count({ where: { status: RescuerStatus.APPROVED } }),
      this.prisma.rescuerProfile.count({ where: { status: RescuerStatus.PENDING } }),
      this.prisma.animal.count(),
      this.prisma.animal.count({ where: { status: 'DISPONIBLE' } }),
      this.prisma.animal.count({ where: { status: 'ADOPTADO' } }),
      this.prisma.adoptionRequest.count(),
      this.prisma.adoptionRequest.count({ where: { status: 'PENDIENTE' } }),
    ]);

    return {
      users: { total: totalUsers },
      rescuers: { approved: totalRescuers, pending: pendingRescuers },
      animals: { total: totalAnimals, available: availableAnimals, adopted: adoptedAnimals },
      requests: { total: totalRequests, pending: pendingRequests },
    };
  }
}
