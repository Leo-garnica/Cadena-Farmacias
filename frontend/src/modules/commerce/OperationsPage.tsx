import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { BarChart3, Boxes, ClipboardList, ReceiptText, UsersRound } from 'lucide-react'
import { useAuth } from '../access/public'
import { roles, staffLoginPath, staffRequestPath, useResource, type Identity, type StaffBranch } from './api'
import { CommerceFrame, Heading, Message, SignOut } from './shared'

const OrdersDesk = lazy(() => import('./OrdersDesk').then(module => ({ default: module.OrdersDesk })))
const CashDesk = lazy(() => import('./CashDesk').then(module => ({ default: module.CashDesk })))
const HistoryDesk = lazy(() => import('./ManagementPages').then(module => ({ default: module.HistoryDesk })))
const StockDesk = lazy(() => import('./ManagementPages').then(module => ({ default: module.StockDesk })))
const AccessDesk = lazy(() => import('./ManagementPages').then(module => ({ default: module.AccessDesk })))

const sections = [
  { id: 'pedidos', label: 'Pedidos', Icon: ClipboardList },
  { id: 'caja', label: 'Caja presencial', Icon: ReceiptText },
  { id: 'historial', label: 'Historial de ventas', Icon: BarChart3 },
  { id: 'stock', label: 'Stock y catálogo', Icon: Boxes },
  { id: 'personal', label: 'Personal y accesos', Icon: UsersRound },
] as const
type Section = typeof sections[number]['id']

function Workspace({ branches, userId }: { branches: StaffBranch[]; userId: string }) {
  const [selected, setSelected] = useState(0)
  const [section, setSection] = useState<Section>('pedidos')
  const branch = branches.find(item => item.id === selected) ?? branches[0]
  const supervisedBranches = useMemo(
    () => branches.filter(item => item.rol === 'supervisor'),
    [branches],
  )
  if (!branch) return <Message>Tu cuenta todavía no tiene sucursales asignadas. Solicita acceso para empezar.</Message>
  const allowed = sections.filter(item => item.id === 'pedidos' || (item.id === 'caja' && branch.rol !== 'supervisor')
    || (item.id === 'historial' && branch.rol === 'supervisor') || (item.id !== 'caja' && item.id !== 'historial' && branch.rol !== 'empleado'))
  const current = allowed.some(item => item.id === section) ? section : 'pedidos'
  return <>
    <Heading title="Operaciones de sucursal" detail={roles[branch.rol]}>
      <label className="commerce-branch-select">Sucursal activa<select value={branch.id} onChange={event => setSelected(Number(event.target.value))}>
        {branches.map(item => <option key={item.id} value={item.id}>{item.nombre} · {item.departamento}</option>)}
      </select></label>
    </Heading>
    <nav className="commerce-section-nav" aria-label="Operaciones">
      {allowed.map(({ id, label, Icon }) => <button key={id} className="commerce-section-link" aria-current={current === id ? 'page' : undefined} onClick={() => setSection(id)}><Icon size={18} aria-hidden /> {label}</button>)}
    </nav>
    <Suspense fallback={<Message>Cargando sección…</Message>}>
      {current === 'pedidos' && <OrdersDesk key={branch.id} branch={branch.id} userId={userId} staffRole={branch.rol} />}
      {current === 'caja' && <CashDesk key={branch.id} branch={branch.id} userId={userId} />}
      {current === 'historial' && <HistoryDesk branches={supervisedBranches} userId={userId} />}
      {current === 'stock' && <StockDesk key={branch.id} branch={branch} userId={userId} />}
      {current === 'personal' && <AccessDesk key={branch.id} branch={branch} userId={userId} />}
    </Suspense>
  </>
}

export function OperationsPage() {
  const auth = useAuth()
  const userId = auth.state.user?.id
  const identity = useResource<Identity>(userId ? '/identidad' : null, { scope: userId })
  useEffect(() => { document.title = 'Operaciones · VitaFarma' }, [])
  return <CommerceFrame area="Operaciones" actions={<>
    {userId ? <SignOut /> : <Link to={staffLoginPath}>Iniciar sesión</Link>}
  </>}>
    {!auth.state.ready || identity.loading ? <Message>Preparando las operaciones…</Message>
      : !userId ? <><Heading title="Operaciones de sucursal" detail="Inicia sesión con una cuenta de personal." />
        <div className="commerce-order-actions"><Link className="button button--primary" to={staffLoginPath}>Iniciar sesión</Link><Link className="button button--secondary" to={staffRequestPath}>Solicitar ingreso</Link></div></>
      : identity.error ? <Message type="error" retry={identity.refresh}>{identity.error}</Message>
      : identity.data?.tipo === 'personal' ? <Workspace key={userId} branches={identity.data.sucursales} userId={userId} />
      : identity.data?.tipo === 'cliente' ? <Message>Las operaciones requieren una cuenta de personal aprobada.</Message>
      : identity.data?.tipo === 'sin_registro' && <Message>Tu acceso sigue pendiente de aprobación. <Link to={staffRequestPath}>Revisar solicitud</Link></Message>}
  </CommerceFrame>
}
