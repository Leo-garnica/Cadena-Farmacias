import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { Eye, EyeOff, LockKeyhole, UserRoundPlus } from 'lucide-react'
import { accessErrorMessage, useAuth } from '../access/public'
import { Button } from '../../shared/ui/Button'
import { customerOrdersPath, operationsPath, send, staffLoginPath, storePath, useAction, useResource, type Branch, type Identity, type StaffApplication } from './api'
import { Back, CommerceFrame, Heading, Message, SignOut } from './shared'
import './account-access.css'

function Credentials({ staff = false }: { staff?: boolean }) {
  const [creating, setCreating] = useState(staff)
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const auth = useAuth()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || !auth.configured) return
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')
    submitting.current = true
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (!creating) await auth.signIn(email, password)
      else if (await auth.register(email, password) === 'confirmation') {
        setNotice('Revisa tu correo, confirma la cuenta y luego inicia sesión aquí.')
        setCreating(false)
        setVisible(false)
      }
    } catch (failure) { setError(accessErrorMessage(failure)) }
    finally { submitting.current = false; setBusy(false) }
  }
  return <div className="commerce-auth">
    <div className="commerce-auth-head">
      {creating ? <UserRoundPlus size={25} aria-hidden /> : <LockKeyhole size={25} aria-hidden />}
      <h2>{creating ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
      <p>{staff ? 'Verifica tu identidad antes de solicitar permiso para una sucursal.' : creating ? 'Usa tu correo para crear tu cuenta de cliente.' : 'Ingresa con el correo de tu cuenta de cliente.'}</p>
    </div>
    <form className="commerce-form" onSubmit={event => void submit(event)} aria-busy={busy} key={String(creating)}>
      <label>Correo electrónico<input name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={254} required disabled={busy} /></label>
      <div className="account-password-field"><label htmlFor="account-password">Contraseña</label>
        <div><input id="account-password" name="password" type={visible ? 'text' : 'password'} autoComplete={creating ? 'new-password' : 'current-password'} required minLength={creating ? 8 : undefined} maxLength={128} disabled={busy} />
          <button type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} disabled={busy} onClick={() => setVisible(value => !value)}>
            {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button></div></div>
      {creating && <p className="commerce-helper">Usa al menos 8 caracteres.</p>}
      {(error || auth.state.error) && <Message type="error">{error ?? auth.state.error}</Message>}
      {notice && <Message>{notice}</Message>}
      <Button type="submit" disabled={busy || !auth.configured}>{busy ? 'Procesando…' : creating ? 'Crear cuenta' : 'Iniciar sesión'}</Button>
    </form>
    <button className="commerce-text-button" onClick={() => { setCreating(value => !value); setVisible(false); setError(null); setNotice(null) }} disabled={busy}>
      {creating ? 'Ya tengo cuenta' : 'Crear una cuenta'}
    </button>
  </div>
}

export function CustomerLoginPage() {
  const auth = useAuth()
  const [params] = useSearchParams()
  const returningTo = params.get('volver')
  const destination = returningTo === 'pedidos' ? customerOrdersPath
    : returningTo === 'carrito' ? storePath + '?carrito=1' : storePath
  const identity = useResource<Identity>(auth.state.user ? '/identidad' : null, { scope: auth.state.user?.id })
  const action = useAction()
  useEffect(() => { document.title = 'Cuenta de la tienda · VitaFarma' }, [])

  if (identity.data?.tipo === 'cliente') return <Navigate to={destination} replace />
  return <main className="customer-access">
    <a className="skip-link" href="#customer-form">Ir al formulario</a>
    <section className="customer-access-story" aria-labelledby="customer-title">
      <div className="customer-access-copy">
        <Link to="/" className="customer-wordmark" aria-label="VitaFarma, inicio"><span aria-hidden="true">✚</span>VitaFarma</Link>
        <h1 id="customer-title">Tu cuenta VitaFarma</h1>
        <p>{returningTo === 'carrito' ? 'Inicia sesión para volver a tu carrito y elegir cómo recibir tu compra.'
          : returningTo === 'pedidos' ? 'Consulta tus pedidos, sigue su preparación y encuentra tus comprobantes.'
          : 'Compra en tu sucursal y consulta cuándo estará listo tu pedido.'}</p>
      </div>
      <img src="/images/mostrador.webp" alt="" width="1448" height="1086" />
    </section>
    <section className="customer-access-panel" id="customer-form" tabIndex={-1} aria-label="Acceso de clientes">
      <div className="customer-access-nav">
        <Back to={returningTo === 'carrito' ? destination : storePath}>{returningTo === 'carrito' ? 'Volver al carrito' : 'Volver a la tienda'}</Back>
        {auth.state.user && <SignOut />}
      </div>
      {!auth.state.ready || identity.loading ? <Message>Estamos comprobando tu cuenta…</Message> : !auth.state.user ? <Credentials />
        : identity.error ? <Message type="error" retry={identity.refresh}>{identity.error}</Message>
        : identity.data?.tipo === 'personal' ? <Message>Esta cuenta pertenece al equipo. <Link to={operationsPath}>Abrir operaciones</Link></Message>
        : identity.data?.tipo === 'sin_registro' && <div className="commerce-auth">
          <div className="commerce-auth-head"><h2>Completa tu cuenta</h2></div>
          <form className="commerce-form" onSubmit={event => {
            event.preventDefault()
            const nombre = String(new FormData(event.currentTarget).get('nombre') ?? '').trim()
            void action.run(async () => {
              await send('/clientes', { nombre })
              identity.refresh()
            })
          }}>
            <label>Nombre completo<input name="nombre" autoComplete="name" minLength={2} maxLength={120} required /></label>
            {action.error && <Message type="error">{action.error}</Message>}
            <Button type="submit" disabled={action.busy}>{action.busy ? 'Guardando…' : 'Continuar'}</Button>
          </form>
        </div>}
    </section>
  </main>
}

export function StaffRequestPage() {
  const auth = useAuth()
  const identity = useResource<Identity>(auth.state.user ? '/identidad' : null, { scope: auth.state.user?.id })
  const branches = useResource<Branch[]>('/sucursales', { public: true })
  const applications = useResource<{ solicitudes: StaffApplication[] }>(identity.data?.tipo === 'sin_registro' ? '/accesos/solicitudes' : null, { scope: auth.state.user?.id, poll: 7000 })
  const action = useAction()
  const [submitted, setSubmitted] = useState(false)
  const refreshIdentity = identity.refresh
  useEffect(() => { document.title = 'Solicitar acceso · VitaFarma' }, [])
  useEffect(() => {
    if (applications.data?.solicitudes.some(request => request.estado === 'aprobada')) refreshIdentity()
  }, [applications.data, refreshIdentity])
  if (identity.data?.tipo === 'personal') return <Navigate to={operationsPath} replace />
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    void action.run(async () => {
      await send('/accesos/solicitudes', {
        nombre: String(values.get('nombre') ?? '').trim(),
        sucursal: Number(values.get('sucursal')),
        rol: values.get('rol'),
      })
      setSubmitted(true)
      applications.refresh()
    }, 'Ya tienes una solicitud pendiente para esta sucursal.')
  }
  const pending = applications.data?.solicitudes.some(application => application.estado === 'pendiente')
  return <CommerceFrame area="Acceso del personal" actions={auth.state.user ? <SignOut /> : <Link to={staffLoginPath}>Iniciar sesión</Link>}>
    <Back to={staffLoginPath}>Volver al portal del personal</Back>
    <Heading title="Solicitar acceso a una sucursal" detail="El jefe de sucursal revisa el acceso de empleados. El supervisor departamental revisa el acceso de los jefes." />
    {!auth.state.ready || identity.loading ? <Message>Estamos comprobando tu cuenta…</Message> : !auth.state.user ? <Credentials staff />
      : identity.error ? <Message type="error" retry={identity.refresh}>{identity.error}</Message>
      : identity.data?.tipo === 'cliente' ? <Message>Tu sesión pertenece a una cuenta de cliente. Cierra sesión para ingresar con tu cuenta de trabajo.</Message>
      : identity.data?.tipo === 'sin_registro' && <div className="commerce-auth">
        <div className="commerce-auth-head"><h2>Solicitud de ingreso</h2></div>
        {(pending || submitted) && <Message type="success">Enviamos tu solicitud a la persona responsable. Puedes consultar el resultado aquí.</Message>}
        {applications.error && <Message type="error" retry={applications.refresh}>{applications.error}</Message>}
        {applications.data?.solicitudes.length ? <ul className="commerce-lines">
          {applications.data.solicitudes.map(application => <li key={application.id}>
            <span>{branches.data?.find(branch => branch.id === application.sucursal)?.nombre ?? `Sucursal ${application.sucursal}`}</span>
            <strong>{application.estado === 'pendiente' ? 'Pendiente' : application.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}</strong>
          </li>)}
        </ul> : null}
        {!pending && <form className="commerce-form" onSubmit={submit}>
          <label>Nombre completo<input name="nombre" autoComplete="name" minLength={2} maxLength={120} required /></label>
          <label>Sucursal<select name="sucursal" required defaultValue=""><option value="" disabled>Selecciona la sucursal</option>
            {branches.data?.map(branch => <option key={branch.id} value={branch.id}>{branch.nombre}</option>)}
          </select></label>
          <label>Acceso solicitado<select name="rol" defaultValue="empleado"><option value="empleado">Empleado</option><option value="jefe">Jefe de sucursal</option></select></label>
          {branches.error && <Message type="error" retry={branches.refresh}>{branches.error}</Message>}
          {action.error && <Message type="error">{action.error}</Message>}
          <Button type="submit" disabled={action.busy || !branches.data?.length}>{action.busy ? 'Enviando…' : 'Enviar solicitud'}</Button>
        </form>}
      </div>}
  </CommerceFrame>
}
