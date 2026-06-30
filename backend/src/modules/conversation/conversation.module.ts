import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { ConversationRepository } from './conversation.repository';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    AiGatewayModule,
  ],
  controllers: [ConversationController],
  providers: [ConversationRepository, ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
