import { Module } from '@nestjs/common';
import { EightDController } from './eight-d.controller';
import { EightDService } from './eight-d.service';

@Module({
  controllers: [EightDController],
  providers: [EightDService],
})
export class EightDModule {}
