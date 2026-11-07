import { replace, type LoaderFunctionArgs } from 'react-router'
import type { AuthRepository } from '../application/auth.repository'

export const LOGIN_PATH = '/equipo/entrar'

export function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || /[\\\r\n]/.test(value)) return '/inventario'
  const origin = 'https://vitafarma.invalid'
  try {
    const url = new URL(value, origin)
    if (url.origin !== origin || !/^\/inventario(?:\/[1-9]\d*\/[1-9]\d*)?\/?$/.test(url.pathname)) return '/inventario'
    return `${url.pathname}${url.search}`
  } catch { return '/inventario' }
}

export function loginHref(path: string, reason?: 'unavailable') {
  const params = new URLSearchParams({ siguiente: safeReturnTo(path) })
  if (reason) params.set('motivo', reason)
  return `${LOGIN_PATH}?${params}`
}

export function protectLoader<T>(repository: AuthRepository, loader: (args: LoaderFunctionArgs) => T) {
  return async (args: LoaderFunctionArgs) => {
    const url = new URL(args.request.url)
    let user
    try { user = await repository.currentUser() }
    catch { throw replace(loginHref(`${url.pathname}${url.search}`, 'unavailable')) }
    if (!user) throw replace(loginHref(`${url.pathname}${url.search}`))
    args.request.signal.throwIfAborted()
    return loader(args)
  }
}
