import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { RescuersService } from './rescuers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateRescuerDto } from './dto/update-rescuer.dto';

@Controller('rescuers')
@UseGuards(JwtAuthGuard)
export class RescuersController {
  constructor(private readonly rescuersService: RescuersService) {}

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.RESCATISTA)
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.rescuersService.getMyProfile(user.id);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(Role.RESCATISTA)
  updateMyProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateRescuerDto,
  ) {
    return this.rescuersService.updateMyProfile(user.id, dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.rescuersService.getById(id);
  }
}
