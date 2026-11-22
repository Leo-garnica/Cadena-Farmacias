import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../access/public'

export interface Field {
  clave: string
  etiqueta: string
  tipo: 'texto' | 'entero' | 'importe' | 'fecha' | 'opcion'
  requerido: boolean
  referencia?: string
  opciones?: string[]
  soloAlta?: boolean
  max?: number
}
export interface Resource { clave: string; titulo: string; id: string; campos: Field[]; columnas: string[] }
export type Row = Record<string, string | number | null>
export interface Entries<T> { filas: T[]; total: number }
export type Option = { id: number; nombre: string | null }
export const pageSize = 30
const bobFormat = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' })
export const money = (value: number | string | null) => value == null ? 'Sin registrar' : bobFormat.format(Number(value))
export function civilDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-')
  return day && month && year ? `${day}/${month}/${year}` : value
}

export async function errorMessage(error: unknown): Promise<string> {
  if (!(error instanceof Response)) return 'Se interrumpió la conexión. Vuelve a intentar la operación.'
  if (error.status === 401) return 'Tu sesión venció. Vuelve a ingresar con tu cuenta.'
  if (error.status === 403) return 'Tu cuenta no puede gestionar estos datos de práctica.'
  if (error.status === 404) return 'El registro ya no está disponible para esta cuenta.'
  if (error.status === 503) return 'La base de práctica no está disponible. Puedes volver a intentarlo.'
  if (error.status >= 500) return 'No se pudo completar la operación. Vuelve a intentarlo.'
  try {
    const data = await error.json() as { message?: unknown }
    if (typeof data.message === 'string' && data.message.length < 220) return data.message
  } catch { /* Some HTTP responses have an empty body. */ }
  return error.status === 409 ? 'Hay un conflicto con los datos existentes. Revisa el registro antes de continuar.' : 'Revisa los datos introducidos e inténtalo nuevamente.'
}

interface Snapshot<T> { path: string; revision: number; data?: T; error?: string }
export function useQuery<T>(path: string | null) {
  const [revision, setRevision] = useState(0)
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null)
  const refresh = useCallback(() => setRevision(previous => previous + 1), [])
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    const { signal } = controller
    void apiRequest<T>(path, { signal }).then(data => {
      if (!signal.aborted) setSnapshot({ path, revision, data })
    }).catch(async error => {
      if (signal.aborted) return
      const message = await errorMessage(error)
      if (!signal.aborted) setSnapshot({ path, revision, error: message })
    })
    return () => controller.abort()
  }, [path, revision])
  const current = snapshot?.path === path && snapshot?.revision === revision ? snapshot : null
  return { data: current?.data, error: current?.error, loading: !!path && !current, refresh }
}
