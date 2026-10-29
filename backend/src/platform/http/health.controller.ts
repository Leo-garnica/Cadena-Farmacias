import { Controller, Get } from '@nestjs/common'
import type { HealthResponse } from '@vitafarma/contracts/health'

@Controller('health')
export class HealthController {
  @Get()
  get(): HealthResponse {
    return { status: 'ok', service: 'vitafarma-api', mode: 'demo', database: 'disconnected' }
  }
}
