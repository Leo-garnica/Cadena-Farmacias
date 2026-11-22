import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AuthRepository } from '../application/auth.repository'
import { AuthContext, accessErrorMessage, type AuthState } from './auth-context'

export function AuthProvider({ repository, children }: { repository: AuthRepository; children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ ready: false, user: null, error: null })
  const [notice, setNotice] = useState<string | null>(null)
  const revision = useRef(0)
  const userId = useRef<string | null>(null)
  const endingSession = useRef(false)

  const refresh = useCallback(async () => {
    if (endingSession.current) return
    const current = ++revision.current
    try {
      const user = await repository.currentUser()
      if (current !== revision.current) return
      userId.current = user?.id ?? null
      setState({ ready: true, user, error: null })
    } catch (error) {
      if (current === revision.current) setState({ ready: true, user: null, error: accessErrorMessage(error) })
    }
  }, [repository])

  useEffect(() => {
    const generation = revision
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = repository.subscribe((nextUserId) => {
      clearTimeout(timer)
      if (!nextUserId) {
        revision.current++
        userId.current = null
        setState({ ready: true, user: null, error: null })
        return
      }
      if (endingSession.current) return
      if (nextUserId !== userId.current) {
        revision.current++
        setState({ ready: false, user: null, error: null })
        if (userId.current !== null) {
          // A different account must start with a fresh router and empty loader data.
          window.location.reload()
          return
        }
      }
      timer = setTimeout(() => void refresh(), 0)
    })
    const initialTimer = setTimeout(() => void refresh(), 0)
    return () => { generation.current++; clearTimeout(initialTimer); clearTimeout(timer); unsubscribe() }
  }, [repository, refresh])

  const startSession = useCallback((user: NonNullable<AuthState['user']>) => {
    setNotice(null)
    revision.current++
    userId.current = user.id
    setState({ ready: true, user, error: null })
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    startSession(await repository.signIn(email, password))
  }, [repository, startSession])

  const register = useCallback(async (email: string, password: string): Promise<'session' | 'confirmation'> => {
    const user = await repository.register(email, password)
    if (!user) return 'confirmation'
    startSession(user)
    return 'session'
  }, [repository, startSession])

  const signOut = useCallback(async () => {
    endingSession.current = true
    revision.current++
    setState({ ready: false, user: null, error: null })
    try {
      const result = await repository.signOut()
      setNotice(result === 'local-only' ? 'Cerraste sesión en este navegador. No pudimos confirmar la revocación en el servidor.' : null)
      userId.current = null
      setState({ ready: true, user: null, error: null })
    } catch (error) {
      setState({ ready: true, user: null, error: 'No pudimos cerrar la sesión. Revisa tu conexión y vuelve a intentarlo.' })
      throw error
    } finally { endingSession.current = false }
  }, [repository])

  const value = useMemo(
    () => ({ state, notice, configured: repository.configured, refresh, signIn, register, signOut }),
    [state, notice, repository.configured, refresh, signIn, register, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
