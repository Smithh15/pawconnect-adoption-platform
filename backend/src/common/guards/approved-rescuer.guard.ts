import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { RescuerStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApprovedRescuerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();

    if (user.role === Role.ADMIN) return true;

    const profile = await this.prisma.rescuerProfile.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });

    if (profile?.status !== RescuerStatus.APPROVED) {
      throw new ForbiddenException('Tu perfil de rescatista aún no ha sido aprobado');
    }

    return true;
  }
}
