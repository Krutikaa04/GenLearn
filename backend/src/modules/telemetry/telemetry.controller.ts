import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { IngestEventsDto } from './dto/ingest-events.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Telemetry')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Ingest a batch of behavior events (fire-and-forget from the client)' })
  async ingest(@CurrentUser() user: JwtPayload, @Body() dto: IngestEventsDto) {
    const accepted = await this.telemetryService.ingest(user.userId, dto);
    return { data: { accepted } };
  }
}
