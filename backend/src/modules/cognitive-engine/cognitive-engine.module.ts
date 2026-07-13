import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import {
  ConceptMastery,
  ConceptMasterySchema,
} from '../learner-model/schemas/concept-mastery.schema';
import { CognitiveEngineService } from './cognitive-engine.service';
import { LearnerContextBuilder } from './learner-context.builder';
import { PromptBuilder } from './prompt-builder';
import { ResponseValidator } from './response-validator';

/**
 * The single AI orchestration module. Feature modules import this (not
 * AiGatewayModule) so every AI workflow passes through the Cognitive Engine.
 * The provider (AiGatewayModule) is imported here only, keeping the AI provider
 * abstraction reachable exclusively through the engine.
 */
@Module({
  imports: [
    AiGatewayModule,
    MongooseModule.forFeature([{ name: ConceptMastery.name, schema: ConceptMasterySchema }]),
  ],
  providers: [CognitiveEngineService, LearnerContextBuilder, PromptBuilder, ResponseValidator],
  exports: [CognitiveEngineService],
})
export class CognitiveEngineModule {}
