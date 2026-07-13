import { Module } from '@nestjs/common';
import { TutorController } from './tutor.controller';
import { TutorService } from './tutor.service';
import { CognitiveEngineModule } from '../cognitive-engine/cognitive-engine.module';

@Module({
  imports: [CognitiveEngineModule],
  controllers: [TutorController],
  providers: [TutorService],
})
export class TutorModule {}
