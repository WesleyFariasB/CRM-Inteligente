import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService, type HealthStatus } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe da API' })
  @ApiOkResponse({ description: 'A API está disponível.' })
  getLiveness(): HealthStatus {
    return this.healthService.getLiveness();
  }
}
