import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { ConversationRepository } from './conversation.repository';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { CognitiveEngineModule } from '../cognitive-engine/cognitive-engine.module';
import { LearnerModelModule } from '../learner-model/learner-model.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    CognitiveEngineModule,
    LearnerModelModule,
  ],
  controllers: [ConversationController],
  providers: [ConversationRepository, ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
