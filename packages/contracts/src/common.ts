/** PostgreSQL DATE is an ISO calendar date, never an instant or a JS Date. */
export type DateOnly = `${number}-${number}-${number}`

export interface AccessGrant {
  sub: string
  perfil: 'consulta' | 'responsable'
  sucursales: number[]
}

export interface ApiError {
  statusCode: number
  code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'UNAVAILABLE' | 'INTERNAL_ERROR'
  message: string
}
