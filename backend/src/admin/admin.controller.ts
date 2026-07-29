import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RejectRescuerDto } from './dto/reject-rescuer.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ── Rescuers ──────────────────────────────────────────────

  @Get('rescuers/pending')
  getPendingRescuers() {
    return this.adminService.getPendingRescuers();
  }

  @Patch('rescuers/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveRescuer(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.adminService.approveRescuer(id, user.id);
  }

  @Patch('rescuers/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectRescuer(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RejectRescuerDto,
  ) {
    return this.adminService.rejectRescuer(id, user.id, dto);
  }

  // ── Users ─────────────────────────────────────────────────

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  suspendUser(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SuspendUserDto,
  ) {
    return this.adminService.suspendUser(id, user.id, dto);
  }

  @Patch('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  activateUser(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.adminService.activateUser(id, user.id);
  }
}
