import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdoptionRequestsService } from './adoption-requests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateRequestDto } from './dto/create-request.dto';
import { ReviewRequestDto } from './dto/review-request.dto';

@Controller('adoption-requests')
@UseGuards(JwtAuthGuard)
export class AdoptionRequestsController {
  constructor(private readonly service: AdoptionRequestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADOPTANTE)
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateRequestDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(Role.ADOPTANTE)
  findMyRequests(@CurrentUser() user: { id: string }) {
    return this.service.findMyRequests(user.id);
  }

  @Get('rescuer')
  @UseGuards(RolesGuard)
  @Roles(Role.RESCATISTA)
  findRescuerRequests(@CurrentUser() user: { id: string }) {
    return this.service.findRescuerRequests(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.findOne(id, user.id);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.RESCATISTA)
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReviewRequestDto,
  ) {
    return this.service.approve(id, user.id, dto);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.RESCATISTA)
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReviewRequestDto,
  ) {
    return this.service.reject(id, user.id, dto);
  }

  @Patch(':id/finalize')
  @UseGuards(RolesGuard)
  @Roles(Role.RESCATISTA)
  @HttpCode(HttpStatus.OK)
  finalize(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.finalize(id, user.id);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.ADOPTANTE)
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.cancel(id, user.id);
  }
}
