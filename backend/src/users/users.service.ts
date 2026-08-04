import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { AnimalStatus, RequestStatus, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const match = await bcrypt.compare(dto.currentPassword, user.password);
    if (!match)
      throw new BadRequestException('La contraseña actual es incorrecta');

    if (dto.currentPassword === dto.newPassword)
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  async deleteMe(userId: string, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, role: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Contraseña incorrecta');

    if (user.role === Role.ADOPTANTE) {
      const activeRequest = await this.prisma.adoptionRequest.findFirst({
        where: {
          adopterId: userId,
          status: { in: [RequestStatus.PENDIENTE, RequestStatus.APROBADA] },
        },
      });
      if (activeRequest) {
        throw new BadRequestException(
          'Tienes solicitudes de adopción pendientes o aprobadas. Cancélalas antes de eliminar tu cuenta.',
        );
      }
    }

    if (user.role === Role.RESCATISTA) {
      const profile = await this.prisma.rescuerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (profile) {
        const activeAnimal = await this.prisma.animal.findFirst({
          where: {
            rescuerId: profile.id,
            status: { not: AnimalStatus.ADOPTADO },
          },
        });
        if (activeAnimal) {
          throw new BadRequestException(
            'Tienes animales publicados o en proceso de adopción. Resuélvelos antes de eliminar tu cuenta.',
          );
        }

        await this.prisma.rescuerProfile.update({
          where: { userId },
          data: {
            organizationName: 'Fundación eliminada',
            description: null,
            website: null,
          },
        });
      }
    }

    const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Usuario eliminado',
        email: `eliminado-${userId}@pawconnect.invalid`,
        phone: null,
        password: randomPassword,
        hashedRefreshToken: null,
        status: UserStatus.DELETED,
      },
    });

    return { message: 'Cuenta eliminada exitosamente' };
  }
}
