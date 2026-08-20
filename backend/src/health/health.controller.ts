import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MongooseHealthIndicator } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';
import { AiGatewayService } from '../modules/ai-gateway/ai-gateway.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly mongoose: MongooseHealthIndicator,
    private readonly aiGateway: AiGatewayService,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe (the Render health check) with DB status in body' })
  async check() {
    // This is Render's health probe, so it is a LIVENESS check: it returns 200
    // whenever the process is up, and reports DB status in the body rather than
    // failing the response. If it returned 503 on a transient Mongo blip, Render
    // would restart the whole container (killing queue workers and in-flight
    // work) — and a failed probe also makes logs hard to see. Mongoose reconnects
    // on its own (retryReads/Writes), so the backend rides out blips instead.
    let mongodb: 'up' | 'down' = 'up';
    try {
      await this.mongoose.pingCheck('mongodb', { timeout: 3000 });
    } catch {
      mongodb = 'down';
    }
    return {
      status: 'ok',
      service: 'genlearn-backend',
      version: '1.0.0',
      db: { mongodb },
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health/ai')
  @ApiOperation({ summary: 'AI-service reachability (no LLM call) — diagnostics only' })
  async aiHealth() {
    const ai = await this.aiGateway.checkHealth();
    return { ai, timestamp: new Date().toISOString() };
  }
}
