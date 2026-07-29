import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnimalStatus, Role, RescuerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { FilterAnimalsDto } from './dto/filter-animals.dto';

const ANIMAL_SELECT = {
  id: true,
  name: true,
  species: true,
  breed: true,
  ageMonths: true,
  size: true,
  gender: true,
  city: true,
  description: true,
  healthNotes: true,
  vaccinated: true,
  sterilized: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  rescuer: {
    select: {
      id: true,
      organizationName: true,
      city: true,
      user: { select: { id: true, name: true } },
    },
  },
  images: {
    select: { id: true, url: true, isPrimary: true },
    orderBy: { isPrimary: 'desc' as const },
  },
};

@Injectable()
export class AnimalsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async create(userId: string, dto: CreateAnimalDto) {
    const profile = await this.prisma.rescuerProfile.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (!profile || profile.status !== RescuerStatus.APPROVED) {
      throw new ForbiddenException(
        'Solo rescatistas aprobados pueden publicar animales',
      );
    }

    return this.prisma.animal.create({
      data: {
        ...dto,
        rescuerId: profile.id,
      },
      select: ANIMAL_SELECT,
    });
  }

  async findAll(filters: FilterAnimalsDto) {
    const {
      species,
      size,
      gender,
      status = AnimalStatus.DISPONIBLE,
      city,
      rescuerId,
      page = 1,
      limit = 12,
    } = filters;

    const where = {
      ...(species && { species }),
      ...(size && { size }),
      ...(gender && { gender }),
      status,
      ...(city && {
        city: { contains: city, mode: 'insensitive' as const },
      }),
      ...(rescuerId && { rescuerId }),
    };

    const [animals, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        select: ANIMAL_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.animal.count({ where }),
    ]);

    return {
      data: animals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
      select: ANIMAL_SELECT,
    });

    if (!animal) throw new NotFoundException('Animal no encontrado');
    return animal;
  }

  async update(id: string, userId: string, userRole: Role, dto: UpdateAnimalDto) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
      select: { id: true, rescuer: { select: { userId: true } } },
    });

    if (!animal) throw new NotFoundException('Animal no encontrado');

    const isOwner = animal.rescuer.userId === userId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para editar este animal');
    }

    return this.prisma.animal.update({
      where: { id },
      data: dto,
      select: ANIMAL_SELECT,
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
      select: { id: true, rescuer: { select: { userId: true } } },
    });

    if (!animal) throw new NotFoundException('Animal no encontrado');

    const isOwner = animal.rescuer.userId === userId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para eliminar este animal');
    }

    await this.prisma.animal.delete({ where: { id } });
    return { message: 'Animal eliminado exitosamente' };
  }

  // ── Images ────────────────────────────────────────────────

  async addImage(animalId: string, userId: string, file: Express.Multer.File) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      select: {
        id: true,
        rescuer: { select: { userId: true } },
        _count: { select: { images: true } },
      },
    });

    if (!animal) throw new NotFoundException('Animal no encontrado');
    if (animal.rescuer.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para agregar imágenes a este animal');
    }
    if (animal._count.images >= 6) {
      throw new BadRequestException('Un animal puede tener máximo 6 imágenes');
    }

    const { url, publicId } = await this.uploadService.uploadImage(
      file.buffer,
      'pawconnect/animals',
    );

    const isPrimary = animal._count.images === 0;

    return this.prisma.animalImage.create({
      data: { animalId, url, publicId, isPrimary },
      select: { id: true, url: true, isPrimary: true },
    });
  }

  async setPrimaryImage(animalId: string, imageId: string, userId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      select: { rescuer: { select: { userId: true } } },
    });

    if (!animal) throw new NotFoundException('Animal no encontrado');
    if (animal.rescuer.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para editar este animal');
    }

    const image = await this.prisma.animalImage.findFirst({
      where: { id: imageId, animalId },
    });

    if (!image) throw new NotFoundException('Imagen no encontrada');

    await this.prisma.$transaction([
      this.prisma.animalImage.updateMany({
        where: { animalId },
        data: { isPrimary: false },
      }),
      this.prisma.animalImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    return { message: 'Imagen principal actualizada' };
  }

  async deleteImage(animalId: string, imageId: string, userId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      select: { rescuer: { select: { userId: true } } },
    });

    if (!animal) throw new NotFoundException('Animal no encontrado');
    if (animal.rescuer.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar imágenes de este animal');
    }

    const image = await this.prisma.animalImage.findFirst({
      where: { id: imageId, animalId },
      select: { id: true, publicId: true, isPrimary: true },
    });

    if (!image) throw new NotFoundException('Imagen no encontrada');

    await this.uploadService.deleteImage(image.publicId);
    await this.prisma.animalImage.delete({ where: { id: imageId } });

    // Si era la principal, asignar la siguiente disponible
    if (image.isPrimary) {
      const next = await this.prisma.animalImage.findFirst({
        where: { animalId },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await this.prisma.animalImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    return { message: 'Imagen eliminada exitosamente' };
  }
}
