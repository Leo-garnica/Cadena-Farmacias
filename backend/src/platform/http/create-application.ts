import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../../app.module.js'
import { ApiExceptionFilter } from './api-exception.filter.js'

export async function createApplication() {
  const app = await NestFactory.create(AppModule, { logger: false })
  const server = app.getHttpAdapter().getInstance() as { disable?: (setting: string) => void }
  server.disable?.('x-powered-by')
  server.disable?.('etag')
  app.setGlobalPrefix('api/v1')
  app.useGlobalFilters(new ApiExceptionFilter())
  app.use((_request: unknown, response: { setHeader(name: string, value: string): void }, next: () => void) => {
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    next()
  })
  app.enableShutdownHooks()
  return app
}
