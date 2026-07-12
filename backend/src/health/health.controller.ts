import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheckService, MongooseHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
  ) {}

  @Public()
  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Service health check including DB connectivity' })
  async check() {
    const result = await this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
    ]);
    return {
      ...result,
      service: 'genlearn-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
