import { Module } from '@nestjs/common';
import { FmeaController } from './fmea.controller';
import { FmeaService } from './fmea.service';

@Module({
  controllers: [FmeaController],
  providers: [FmeaService],
})
export class FmeaModule {}
