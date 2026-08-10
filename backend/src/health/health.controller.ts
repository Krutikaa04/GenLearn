import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheckService, MongooseHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';
import { AiGatewayService } from '../modules/ai-gateway/ai-gateway.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly aiGateway: AiGatewayService,
  ) {}

  @Public()
  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Service health check including DB connectivity' })
  async check() {
    // Only MongoDB gates the health status — this endpoint is the Render probe,
    // and the backend is fully functional (auth, dashboards, history) even when
    // the ai-service is asleep. AI reachability is reported as informational so
    // ops can see it without a sleeping AI instance triggering a backend restart.
    const result = await this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
    ]);
    const ai = await this.aiGateway.checkHealth();
    return {
      ...result,
      service: 'genlearn-backend',
      version: '1.0.0',
      ai: { reachable: ai.reachable, detail: ai.detail },
      timestamp: new Date().toISOString(),
    };
  }
}
