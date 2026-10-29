import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../../app.module.js'
import { ApiExceptionFilter } from './api-exception.filter.js'

export async function createApplication() {
  const app = await NestFactory.create(AppModule, { logger: false })
  app.setGlobalPrefix('api/v1')
  app.useGlobalFilters(new ApiExceptionFilter())
  app.use((_request: unknown, response: { setHeader(name: string, value: string): void }, next: () => void) => {
    response.setHeader('X-VitaFarma-Data', 'synthetic-demo')
    next()
  })
  // No CORS, database connection, credentials, or authentication provider is configured.
  app.enableShutdownHooks()
  return app
}
