import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import { AnimalsService } from './animals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { FilterAnimalsDto } from './dto/filter-animals.dto';

@Controller('animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  // ── Rutas PÚBLICAS (lectura) — token opcional ──────────────

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() filters: FilterAnimalsDto) {
    return this.animalsService.findAll(filters);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.animalsService.findOne(id);
  }

  // ── Rutas PROTEGIDAS — requieren token JWT válido ──────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESCATISTA)
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAnimalDto,
  ) {
    return this.animalsService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
    @Body() dto: UpdateAnimalDto,
  ) {
    return this.animalsService.update(id, user.id, user.role, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.animalsService.remove(id, user.id, user.role);
  }

  // ── Imágenes — solo RESCATISTA ─────────────────────────────

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESCATISTA)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  addImage(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.animalsService.addImage(id, user.id, file);
  }

  @Patch(':id/images/:imageId/primary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESCATISTA)
  @HttpCode(HttpStatus.OK)
  setPrimaryImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.animalsService.setPrimaryImage(id, imageId, user.id);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESCATISTA)
  @HttpCode(HttpStatus.OK)
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.animalsService.deleteImage(id, imageId, user.id);
  }
}
