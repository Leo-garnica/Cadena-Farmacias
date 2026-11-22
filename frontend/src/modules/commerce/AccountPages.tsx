import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { LockKeyhole, UserRoundPlus } from 'lucide-react'
import { accessErrorMessage, useAuth } from '../access/public'
import { Button } from '../../shared/ui/Button'
import { customerOrdersPath, operationsPath, send, staffLoginPath, storePath, useAction, useResource, type Branch, type Identity, type StaffApplication } from './api'
import { Back, CommerceFrame, Heading, Message, SignOut } from './shared'

function Credentials({ staff = false }: { staff?: boolean }) {
  const [creating, setCreating] = useState(staff)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const auth = useAuth()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (!creating) await auth.signIn(email, password)
      else if (await auth.register(email, password) === 'confirmation') {
        setNotice('Revisa tu correo, confirma la cuenta y luego inicia sesión aquí.')
        setCreating(false)
      }
    } catch (failure) { setError(accessErrorMessage(failure)) }
    finally { setBusy(false) }
  }
  return <div className="commerce-auth">
    <div className="commerce-auth-head">
      {creating ? <UserRoundPlus size={25} aria-hidden /> : <LockKeyhole size={25} aria-hidden />}
      <h2>{creating ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
      <p>{staff ? 'Verifica tu identidad antes de solicitar permiso para una sucursal.' : 'Accede a tu carrito y consulta tus pedidos.'}</p>
    </div>
    <form className="commerce-form" onSubmit={event => void submit(event)} aria-busy={busy} key={String(creating)}>
      <label>Correo electrónico<input name="email" type="email" autoComplete="username" maxLength={254} required /></label>
      <label>Contraseña<input name="password" type="password" autoComplete={creating ? 'new-password' : 'current-password'} required minLength={creating ? 8 : undefined} maxLength={128} /></label>
      {(error || auth.state.error) && <Message type="error">{error ?? auth.state.error}</Message>}
      {notice && <Message>{notice}</Message>}
      <Button type="submit" disabled={busy || !auth.configured}>{busy ? 'Procesando…' : creating ? 'Crear cuenta' : 'Iniciar sesión'}</Button>
    </form>
    <button className="commerce-text-button" onClick={() => { setCreating(value => !value); setError(null); setNotice(null) }} disabled={busy}>
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
  return <CommerceFrame area="Cuenta de la tienda" actions={auth.state.user && <SignOut />}>
    <Back to={returningTo === 'carrito' ? destination : storePath}>{returningTo === 'carrito' ? 'Volver al carrito' : 'Volver a la tienda'}</Back>
    <Heading title="Tu cuenta VitaFarma" />
    {!auth.state.ready || identity.loading ? <Message>Estamos comprobando tu cuenta…</Message> : !auth.state.user ? <Credentials />
      : identity.error ? <Message type="error" retry={identity.refresh}>{identity.error}</Message>
      : identity.data?.tipo === 'personal' ? <Message>Esta cuenta pertenece al equipo. <Link to={operationsPath}>Abrir operaciones</Link></Message>
      : identity.data?.tipo === 'sin_registro' && <div className="commerce-auth">
        <div className="commerce-auth-head"><UserRoundPlus size={25} aria-hidden /><h2>Completa tu cuenta</h2></div>
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
          <Button type="submit" disabled={action.busy}>{action.busy ? 'Guardando…' : 'Continuar a la tienda'}</Button>
        </form>
      </div>}
  </CommerceFrame>
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
    <Back to="/">Volver al inicio</Back>
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
