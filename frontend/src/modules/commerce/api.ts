import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '../access/public'

export interface Branch { id: number; nombre: string; ciudad: string | null; direccion: string | null }
export interface Product { codigo: number; nombre: string; presentacion: string | null; precioCentavos: number; disponible: number }
export interface Zone { id: number; nombre: string; envioCentavos: number; plazo: string }
export interface Line { codigo: number; cantidad: number }
export interface DetailLine extends Line { nombre: string; precioCentavos: number }
export type Modality = 'retiro' | 'envio'
export type OrderStatus = 'confirmado' | 'en_preparacion' | 'listo' | 'en_camino' | 'entregado' | 'cancelado' | 'devuelto'
export type OrderAction = 'tomar' | 'liberar' | 'preparar' | 'despachar' | 'entregar' | 'cancelar' | 'reasignar' | 'devolver'
export interface Sale {
  id: number
  farmacia: number
  fecha: string
  canal: 'online' | 'presencial'
  totalCentavos: number
  empleado?: string
  empleadoNombre?: string | null
  items: DetailLine[]
  pedido?: number
  revertida?: boolean
}
export interface Order {
  id: number
  farmacia: number
  modalidad: Modality
  estado: OrderStatus
  fecha: string
  vence?: string
  totalCentavos: number
  envioCentavos: number
  asignado?: string
  codigoRetiro?: string
  direccion?: string
  pago: 'simulado' | 'revertido'
  items: DetailLine[]
  venta?: Sale
}
export interface Ranking { farmacia: number; nombre: string; totalCentavos: number; unidades: number; ventas: number }
export interface SalesHistory { ventas: Sale[]; ranking: Ranking[] }
export interface StockMovement { id: number; farmacia: number; codigo: number; cantidad: number; motivo: string; fecha: string; actor: string }
export type StaffRole = 'supervisor' | 'jefe' | 'empleado'
export const roles: Record<StaffRole, string> = { empleado: 'Empleado', jefe: 'Jefe de sucursal', supervisor: 'Supervisor departamental' }
export interface StaffBranch { id: number; nombre: string; departamento: string; rol: StaffRole }
export interface Identity { tipo: 'sin_registro' | 'cliente' | 'personal'; nombre: string | null; sucursales: StaffBranch[] }
export interface StaffApplication {
  id: number
  nombre: string
  correo: string
  sucursal: number
  rol: 'empleado' | 'jefe'
  estado: 'pendiente' | 'aprobada' | 'rechazada'
}
export interface StaffMember { sub: string; nombre: string; correo: string; rol: StaffRole; sucursal: number; activo: boolean; sePuedeDesactivar: boolean }

export const storePath = '/tienda'
export const customerLoginPath = '/tienda/entrar'
export const customerOrdersPath = '/tienda/pedidos'
export const staffLoginPath = '/equipo/entrar?siguiente=/operaciones'
export const staffRequestPath = '/equipo/solicitar'
export const operationsPath = '/operaciones'

const base = '/comercio'
const currency = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' })
const dateTime = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/La_Paz' })
export const money = (cents: number) => currency.format(cents / 100)
export const dateLabel = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateTime.format(date)
}

export function query(values: Record<string, string | number | null | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (value != null && value !== '') params.set(key, String(value))
  const encoded = params.toString()
  return encoded ? '?' + encoded : ''
}

export function apiMessage(error: unknown, conflict: string) {
  if (!(error instanceof Response)) return 'La conexión se interrumpió. Vuelve a intentar la operación.'
  const messages: Record<number, string> = {
    400: 'Revisa los datos que ingresaste y vuelve a intentarlo.',
    401: 'Tu sesión terminó. Vuelve a iniciar sesión.',
    403: 'Tu cuenta no tiene permiso para realizar esta operación.',
    404: 'Esta operación ya no está disponible. Actualiza la pantalla.',
    409: conflict,
    429: 'Se hicieron demasiados intentos. Espera un momento antes de continuar.',
    503: 'El comercio de práctica no está disponible. Comprueba que esté iniciado.',
  }
  return messages[error.status] ?? 'No pudimos completar la operación. Vuelve a intentarlo.'
}

export function send<T>(path: string, body: unknown, method: 'POST' | 'PATCH' = 'POST') {
  return apiRequest<T>(base + path, { method, body: JSON.stringify(body) })
}

async function readPublic<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch('/api/v1' + base + path, {
    headers: { Accept: 'application/json' }, cache: 'no-store', redirect: 'error',
    signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]),
  })
  if (!response.ok) throw response
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Response(null, { status: 503 })
  return response.json() as Promise<T>
}

export function useResource<T>(path: string | null, options: { public?: boolean; poll?: number; scope?: string } = {}) {
  const { public: anonymous = false, poll = 0, scope = '' } = options
  const key = path === null ? null : scope + '|' + path
  const [snapshot, setSnapshot] = useState<{ key: string; data?: T; error?: string } | null>(null)
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    if (!path || !key) return
    const controller = new AbortController()
    const { signal } = controller
    let timeout: number | undefined
    function schedule() {
      window.clearTimeout(timeout)
      if (!poll || signal.aborted || document.visibilityState === 'hidden') return
      timeout = window.setTimeout(() => void request(), poll)
    }
    async function request() {
      if (!path || !key || signal.aborted) return
      try {
        const data = anonymous ? await readPublic<T>(path, signal) : await apiRequest<T>(base + path, { signal })
        if (!signal.aborted) setSnapshot({ key, data })
      } catch (error) {
        if (!signal.aborted) {
          const message = apiMessage(error, 'Los datos cambiaron. Vuelve a cargar esta vista.')
          const transient = !(error instanceof Response) || error.status >= 500
          setSnapshot(previous => ({ key, data: poll && transient && previous?.key === key ? previous.data : undefined, error: message }))
        }
      }
      schedule()
    }
    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        window.clearTimeout(timeout)
      } else if (poll && !signal.aborted) {
        window.clearTimeout(timeout)
        void request()
      }
    }
    if (poll) document.addEventListener('visibilitychange', handleVisibility)
    void request()
    return () => {
      controller.abort()
      window.clearTimeout(timeout)
      if (poll) document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [anonymous, key, path, poll, revision])
  const current = key && snapshot?.key === key ? snapshot : null
  return { data: current?.data, error: current?.error, loading: !!key && !current, refresh }
}

export function useAction() {
  const active = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = useCallback(async (task: () => Promise<void>, conflict = 'Los datos cambiaron. Revisa la operación y vuelve a intentarlo.') => {
    if (active.current) return
    active.current = true
    setBusy(true)
    setError(null)
    try { await task() }
    catch (failure) { setError(apiMessage(failure, conflict)) }
    finally { active.current = false; setBusy(false) }
  }, [])
  const clear = useCallback(() => setError(null), [])
  return useMemo(() => ({ busy, error, run, clear }), [busy, error, run, clear])
}

export function useOperationId() {
  const last = useRef<{ signature: string; id: string } | null>(null)
  return useMemo(() => ({
    idFor(payload: unknown) {
      const signature = JSON.stringify(payload)
      if (last.current?.signature !== signature) last.current = { signature, id: crypto.randomUUID() }
      return last.current.id
    },
    finish() { last.current = null },
  }), [])
}

// An ambiguous response can follow a successful commit. Retrying the exact body
// lets the server reconcile the transaction even when availability has changed.
export function useCheckout<T, Payload extends object>(path: string) {
  const action = useAction()
  const [pending, setPending] = useState<(Payload & { operacionId: string }) | null>(null)
  const { run } = action
  const confirm = useCallback((payload: Payload | undefined, done: (data: T) => void, refresh: () => void) => {
    const request = pending ?? (payload && { ...payload, operacionId: crypto.randomUUID() })
    if (!request) return
    void run(async () => {
      try {
        const response = await send<T>(path, request)
        setPending(null)
        done(response)
      } catch (failure) {
        const ambiguous = !(failure instanceof Response) || failure.status >= 500 || (pending && failure.status === 401)
        setPending(ambiguous ? request : null)
        throw failure
      } finally { refresh() }
    }, 'Cambió la disponibilidad o el precio. Revisa las cantidades y el total antes de confirmar.')
  }, [path, pending, run])
  return useMemo(() => ({ ...action, pending: pending !== null, confirm }), [action, pending, confirm])
}
