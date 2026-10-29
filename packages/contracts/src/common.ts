/** PostgreSQL DATE is an ISO calendar date, never an instant or a JS Date. */
export type DateOnly = `${number}-${number}-${number}`

/** Public errors omit exception details, connection strings and personal data. */
export interface ApiError {
  statusCode: number
  code: 'BAD_REQUEST' | 'NOT_FOUND' | 'UNAVAILABLE' | 'INTERNAL_ERROR'
  message: string
}
