import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiGatewayService } from './ai-gateway.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 120_000,
      maxRedirects: 0,
    }),
  ],
  providers: [AiGatewayService],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}
