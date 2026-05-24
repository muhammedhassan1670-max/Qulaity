import { Module } from '@nestjs/common';
import { NcrController } from './ncr.controller';
import { NcrService } from './ncr.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [NcrController],
  providers: [NcrService],
})
export class NcrModule {}
