import { Module } from '@nestjs/common';
import { RescuersController } from './rescuers.controller';
import { RescuersService } from './rescuers.service';

@Module({
  controllers: [RescuersController],
  providers: [RescuersService],
})
export class RescuersModule {}
