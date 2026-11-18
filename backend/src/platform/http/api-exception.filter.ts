import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common'
import type { ApiError } from '@vitafarma/contracts/common'

const responses: Partial<Record<number, Pick<ApiError, 'code' | 'message'>>> = {
  400: { code: 'BAD_REQUEST', message: 'Parámetros de consulta inválidos' },
  401: { code: 'UNAUTHORIZED', message: 'Inicia sesión de nuevo' },
  403: { code: 'FORBIDDEN', message: 'Acceso no autorizado' },
  404: { code: 'NOT_FOUND', message: 'Recurso no encontrado' },
  503: { code: 'UNAVAILABLE', message: 'Consulta no disponible' },
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const status = exception instanceof HttpException ? exception.getStatus() : 500
    const safe = responses[status] ?? { code: 'INTERNAL_ERROR', message: 'Error interno del servicio' }
    host.switchToHttp().getResponse<{ status(code: number): { json(body: ApiError): void } }>()
      .status(status).json({ statusCode: status, ...safe })
  }
}
