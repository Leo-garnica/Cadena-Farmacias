import { Controller, Get, Inject, Optional, ServiceUnavailableException } from '@nestjs/common'
import type { HealthResponse } from '@vitafarma/contracts/health'

/** The operational read adapter supplies a bounded check that rejects on failure. */
export abstract class ReadDatabaseProbe {
  abstract check(): Promise<void>
}

@Controller()
export class HealthController {
  constructor(@Optional() @Inject(ReadDatabaseProbe) private readonly database?: ReadDatabaseProbe) {}

  @Get('health')
  get(): HealthResponse {
    return { status: 'ok', service: 'vitafarma-api', mode: 'demo', database: 'disconnected' }
  }

  @Get('ready')
  async ready() {
    if (!this.database) throw new ServiceUnavailableException()
    try {
      await this.database.check()
    } catch {
      throw new ServiceUnavailableException()
    }
    return { status: 'ready' }
  }
}
