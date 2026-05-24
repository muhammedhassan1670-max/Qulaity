import { Module } from '@nestjs/common';
import { ProductionLayoutController } from './production-layout.controller';
import { ProductionLayoutService } from './production-layout.service';

@Module({
  controllers: [ProductionLayoutController],
  providers: [ProductionLayoutService],
})
export class ProductionLayoutModule {}
