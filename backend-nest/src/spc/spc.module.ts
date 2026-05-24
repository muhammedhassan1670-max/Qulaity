import { Module } from '@nestjs/common';
import { SpcController } from './spc.controller';
import { SpcService } from './spc.service';

@Module({
  controllers: [SpcController],
  providers: [SpcService],
})
export class SpcModule {}
