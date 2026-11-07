import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sprout } from 'lucide-react'
import { Button } from '../../../shared/ui/Button'
import { AsyncState } from '../../../shared/ui/AsyncState'
import { useAuth, accessErrorMessage } from './auth-context'
import { safeReturnTo } from './loaders'
import './access.css'

export function LoginPage({ brand }: { brand: ReactNode }) {
  const { state, notice, configured, signIn, refresh } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const submitting = useRef(false)
  useEffect(() => { document.title = 'Iniciar sesión · VitaFarma' }, [])
  useEffect(() => {
    let active = true
    void refresh().then(() => { if (active) setChecked(true) })
    return () => { active = false }
  }, [refresh])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || !configured) return
    submitting.current = true
    setBusy(true)
    setError(null)
    try { await signIn(email.trim(), password) }
    catch (failure) { setError(accessErrorMessage(failure)) }
    finally { setPassword(''); setBusy(false); submitting.current = false }
  }

  if (checked && state.ready && state.user) return <Navigate to={safeReturnTo(params.get('siguiente'))} replace />

  return <main className="login-layout">
    <section className="login-story" aria-label="Bienvenida a VitaFarma">
      <div className="login-brand">{brand}</div>
      <div className="login-story__body">
        <span className="login-eyebrow">TU ESPACIO DE TRABAJO</span>
        <h1>Cuidar empieza<br /> por el orden.</h1>
        <p>Un lugar para acompañar el trabajo de tu equipo, cada día.</p>
        <div className="login-emblem" aria-hidden="true"><Sprout size={76} strokeWidth={1} /><span /></div>
      </div>
      <p className="login-story__footer">VitaFarma · Cerca de tu equipo.</p>
    </section>
    <section className="login-panel" aria-labelledby="login-title">
      <div className="login-card">
        <span className="login-section-label"><ShieldCheck size={17} aria-hidden="true" /> Acceso del equipo</span>
        <h2 id="login-title">Qué bueno verte.</h2>
        <p className="login-intro">Inicia sesión con el correo de tu cuenta.</p>
        {notice && <p className="login-notice" role="status">{notice}</p>}
        {(!checked || !state.ready) && !busy ? <AsyncState kind="loading" title="Comprobando tu sesión…" description="Preparando tu acceso." /> : <form onSubmit={(event) => void submit(event)} aria-busy={busy}>
          <div className="login-field"><label htmlFor="login-email">Correo electrónico</label><input id="login-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy || !configured} /></div>
          <div className="login-field"><label htmlFor="login-password">Contraseña</label><div className="login-password"><input id="login-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy || !configured} /><button type="button" className="button button--ghost icon-button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} onClick={() => setVisible(!visible)} disabled={busy || !configured}>{visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button></div></div>
          {error && <p className="login-error" role="alert" ref={errorRef} tabIndex={-1}>{error}</p>}
          {!error && (state.error || params.get('motivo') === 'unavailable') && <p className="login-error" role="alert">{state.error ?? 'No pudimos verificar tu sesión. Revisa tu conexión y vuelve a ingresar.'}</p>}
          <Button className="login-submit" type="submit" disabled={busy || !configured}>{busy ? 'Ingresando…' : 'Iniciar sesión'}{!busy && <ArrowRight size={18} aria-hidden="true" />}</Button>
          <span className="sr-only" role="status">{busy ? 'Verificando correo y contraseña…' : ''}</span>
        </form>}
        <p className="login-help">Si necesitas una cuenta o recuperar tu acceso, contacta a administración.</p>
        <p className="login-note">El inventario disponible en esta versión contiene datos de demostración.</p>
      </div>
    </section>
  </main>
}
