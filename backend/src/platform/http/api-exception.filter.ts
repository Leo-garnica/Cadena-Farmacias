import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common'
import type { ApiError } from '@vitafarma/contracts/common'

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const status = exception instanceof HttpException ? exception.getStatus() : 500
    const code: ApiError['code'] = status === 400 ? 'BAD_REQUEST' : status === 404 ? 'NOT_FOUND' : status === 503 ? 'UNAVAILABLE' : 'INTERNAL_ERROR'
    const message = status === 400 ? 'Parámetros de consulta inválidos' : status === 404 ? 'Recurso no encontrado' : status === 503 ? 'Consulta no disponible' : 'Error interno del servicio'
    host.switchToHttp().getResponse<{ status(code: number): { json(body: ApiError): void } }>()
      .status(status).json({ statusCode: status, code, message })
  }
}
