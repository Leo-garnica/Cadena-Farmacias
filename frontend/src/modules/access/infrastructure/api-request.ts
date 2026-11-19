import { supabaseAuthRepository } from './supabase-auth.repository'

/** Same-origin API only. The SDK renews the token and NestJS verifies its scope. */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) throw new Error('Ruta de API inválida')
  const token = await supabaseAuthRepository.accessToken()
  if (!token) throw new Response(null, { status: 401 })
  const headers = new Headers(options.headers)
  headers.set('Authorization', 'Bearer ' + token)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')
  const timeout = AbortSignal.timeout(15_000)
  let response: Response
  try {
    response = await fetch('/api/v1' + path, {
      ...options, headers, cache: 'no-store', redirect: 'error',
      signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
    })
  } catch {
    options.signal?.throwIfAborted()
    throw new Response(null, { status: 503 })
  }
  if (!response.ok) throw response
  if (response.status === 204) return undefined as T
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Response(null, { status: 503 })
  return response.json() as Promise<T>
}
