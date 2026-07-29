import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnimalStatus, RequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { ReviewRequestDto } from './dto/review-request.dto';

const REQUEST_SELECT = {
  id: true,
  motivation: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  animal: {
    select: {
      id: true,
      name: true,
      species: true,
      city: true,
      status: true,
      images: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
    },
  },
  adopter: {
    select: { id: true, name: true, email: true, phone: true },
  },
};

@Injectable()
export class AdoptionRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(adopterId: string, dto: CreateRequestDto) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
      select: { id: true, status: true, rescuer: { select: { userId: true } } },
    });

    if (!animal) throw new NotFoundException('Animal no encontrado');

    if (animal.status !== AnimalStatus.DISPONIBLE) {
      throw new BadRequestException('Este animal no está disponible para adopción');
    }

    if (animal.rescuer.userId === adopterId) {
      throw new BadRequestException('No puedes solicitar adoptar tu propio animal');
    }

    const existing = await this.prisma.adoptionRequest.findFirst({
      where: {
        animalId: dto.animalId,
        adopterId,
        status: RequestStatus.PENDIENTE,
      },
    });

    if (existing) {
      throw new BadRequestException('Ya tienes una solicitud pendiente para este animal');
    }

    return this.prisma.adoptionRequest.create({
      data: {
        animalId: dto.animalId,
        adopterId,
        motivation: dto.motivation,
      },
      select: REQUEST_SELECT,
    });
  }

  async findMyRequests(adopterId: string) {
    return this.prisma.adoptionRequest.findMany({
      where: { adopterId },
      select: REQUEST_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRescuerRequests(userId: string) {
    const profile = await this.prisma.rescuerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) throw new NotFoundException('Perfil de rescatista no encontrado');

    return this.prisma.adoptionRequest.findMany({
      where: { animal: { rescuerId: profile.id } },
      select: REQUEST_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const request = await this.prisma.adoptionRequest.findUnique({
      where: { id },
      select: {
        ...REQUEST_SELECT,
        animal: {
          select: {
            id: true,
            name: true,
            species: true,
            city: true,
            status: true,
            images: {
              where: { isPrimary: true },
              select: { url: true },
              take: 1,
            },
            rescuer: { select: { userId: true } },
          },
        },
      },
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');

    const isAdopter = request.adopter.id === userId;
    const isRescuer = request.animal.rescuer.userId === userId;

    if (!isAdopter && !isRescuer) {
      throw new ForbiddenException('No tienes permiso para ver esta solicitud');
    }

    return request;
  }

  async approve(id: string, userId: string, dto: ReviewRequestDto) {
    const request = await this.getRequestForRescuer(id, userId);

    if (request.status !== RequestStatus.PENDIENTE) {
      throw new BadRequestException('Solo se pueden aprobar solicitudes pendientes');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.adoptionRequest.update({
        where: { id },
        data: {
          status: RequestStatus.APROBADA,
          reviewNote: dto.reviewNote,
          reviewedAt: new Date(),
        },
        select: REQUEST_SELECT,
      });

      await tx.animal.update({
        where: { id: request.animalId },
        data: { status: AnimalStatus.EN_PROCESO },
      });

      await tx.adoptionRequest.updateMany({
        where: {
          animalId: request.animalId,
          id: { not: id },
          status: RequestStatus.PENDIENTE,
        },
        data: {
          status: RequestStatus.RECHAZADA,
          reviewNote: 'Otra solicitud fue aprobada para este animal',
          reviewedAt: new Date(),
        },
      });

      return updated;
    });
  }

  async reject(id: string, userId: string, dto: ReviewRequestDto) {
    const request = await this.getRequestForRescuer(id, userId);

    if (request.status !== RequestStatus.PENDIENTE) {
      throw new BadRequestException('Solo se pueden rechazar solicitudes pendientes');
    }

    return this.prisma.adoptionRequest.update({
      where: { id },
      data: {
        status: RequestStatus.RECHAZADA,
        reviewNote: dto.reviewNote,
        reviewedAt: new Date(),
      },
      select: REQUEST_SELECT,
    });
  }

  async finalize(id: string, userId: string) {
    const request = await this.getRequestForRescuer(id, userId);

    if (request.status !== RequestStatus.APROBADA) {
      throw new BadRequestException('Solo se pueden finalizar solicitudes aprobadas');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.adoptionRequest.update({
        where: { id },
        data: {
          status: RequestStatus.FINALIZADA,
          reviewedAt: new Date(),
        },
        select: REQUEST_SELECT,
      });

      await tx.animal.update({
        where: { id: request.animalId },
        data: { status: AnimalStatus.ADOPTADO },
      });

      return updated;
    });
  }

  async cancel(id: string, adopterId: string) {
    const request = await this.prisma.adoptionRequest.findUnique({
      where: { id },
      select: { id: true, adopterId: true, status: true, animalId: true },
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');

    if (request.adopterId !== adopterId) {
      throw new ForbiddenException('No puedes cancelar una solicitud que no es tuya');
    }

    if (
      request.status !== RequestStatus.PENDIENTE &&
      request.status !== RequestStatus.APROBADA
    ) {
      throw new BadRequestException('Esta solicitud no puede cancelarse');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.adoptionRequest.update({
        where: { id },
        data: { status: RequestStatus.CANCELADA },
        select: REQUEST_SELECT,
      });

      if (request.status === RequestStatus.APROBADA) {
        await tx.animal.update({
          where: { id: request.animalId },
          data: { status: AnimalStatus.DISPONIBLE },
        });
      }

      return updated;
    });
  }

  private async getRequestForRescuer(id: string, userId: string) {
    const request = await this.prisma.adoptionRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        animalId: true,
        animal: { select: { rescuer: { select: { userId: true } } } },
      },
    });

    if (!request) throw new NotFoundException('Solicitud no encontrada');

    if (request.animal.rescuer.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para gestionar esta solicitud');
    }

    return request;
  }
}
