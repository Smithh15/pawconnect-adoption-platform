import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RescuersModule } from './rescuers/rescuers.module';
import { AnimalsModule } from './animals/animals.module';
import { AdoptionRequestsModule } from './adoption-requests/adoption-requests.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RescuersModule,
    AnimalsModule,
    AdoptionRequestsModule,
    AdminModule,
    UploadModule,
    StatsModule,
  ],
})
export class AppModule {}
