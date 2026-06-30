import { Module } from '@nestjs/common';
import { TutorController } from './tutor.controller';
import { TutorService } from './tutor.service';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [AiGatewayModule],
  controllers: [TutorController],
  providers: [TutorService],
})
export class TutorModule {}
