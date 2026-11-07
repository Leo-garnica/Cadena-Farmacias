import { useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { LogOut } from 'lucide-react'
import { AsyncState } from '../../../shared/ui/AsyncState'
import { Button } from '../../../shared/ui/Button'
import { useAuth } from './auth-context'
import { loginHref } from './loaders'

export function AccessGate({ children }: { children: ReactNode }) {
  const { state, refresh } = useAuth()
  const location = useLocation()
  if (!state.ready) return <AsyncState kind="loading" title="Verificando tu sesión…" description="Un momento, estamos comprobando tu acceso." />
  if (state.error) return <AsyncState kind="error" title="No pudimos verificar tu sesión" description={state.error} action={<><Button onClick={() => void refresh()}>Reintentar</Button><SignOutButton /></>} />
  if (!state.user) return <Navigate to={loginHref(`${location.pathname}${location.search}`)} replace />
  // A different identity remounts the shell and discards its local UI state.
  return <div key={state.user.id}>{children}</div>
}

export function SessionControls() {
  const { state } = useAuth()
  return <div className="session-controls"><span className="session-email">{state.user?.email}</span><SignOutButton /></div>
}

function SignOutButton() {
  const { signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  async function exit() {
    setBusy(true)
    try { await signOut() }
    catch { /* AuthProvider displays the failure and hides the workspace. */ }
    finally { setBusy(false) }
  }
  return <Button variant="secondary" onClick={() => void exit()} disabled={busy}><LogOut size={16} aria-hidden="true" />{busy ? 'Cerrando…' : 'Cerrar sesión'}</Button>
}
