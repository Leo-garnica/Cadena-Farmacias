import { Controller, Get, Inject } from '@nestjs/common'
import type { HealthResponse } from '@vitafarma/contracts/health'
import { PublicEndpoint } from '../../modules/access/public.js'
import { ReadDatabase } from '../database/read-database.js'

@PublicEndpoint()
@Controller()
export class HealthController {
  constructor(@Inject(ReadDatabase) private readonly database: ReadDatabase) {}

  @Get('health')
  get(): HealthResponse { return { status: 'ok', service: 'vitafarma-api', mode: 'postgresql' } }

  @Get('ready')
  async ready() {
    await this.database.check()
    return { status: 'ready' }
  }
}
