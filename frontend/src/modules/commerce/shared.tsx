import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Check, Clock3, LogOut, PackageCheck, Sprout, Truck } from 'lucide-react'
import { useAuth } from '../access/public'
import { Button } from '../../shared/ui/Button'
import { dateLabel, money, type DetailLine, type Order, type OrderStatus } from './api'
import './commerce.css'

const states: Record<OrderStatus, string> = {
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  devuelto: 'Devuelto',
}

export function CommerceFrame({ area, children, actions }: { area: string; children: ReactNode; actions?: ReactNode }) {
  return <div className="commerce-shell">
    <a className="skip-link" href="#commerce-main">Saltar al contenido</a>
    <header className="commerce-header">
      <div className="commerce-wrap commerce-header-row">
        <Link className="commerce-brand" to="/" aria-label="VitaFarma, inicio"><span><Sprout size={22} aria-hidden /></span> VitaFarma</Link>
        <span className="commerce-area">{area}</span>
        {actions && <nav aria-label={area} className="commerce-header-actions">{actions}</nav>}
      </div>
    </header>
    <main className="commerce-wrap commerce-main" id="commerce-main" tabIndex={-1}>{children}</main>
  </div>
}

export function Heading({ title, detail, children }: { title: string; detail?: string; children?: ReactNode }) {
  return <header className="commerce-heading"><div><h1>{title}</h1>{detail && <p>{detail}</p>}</div>{children}</header>
}

export function Message({ children, type = 'info', retry }: { children: ReactNode; type?: 'info' | 'error' | 'success'; retry?: () => void }) {
  return <div className={'commerce-message commerce-message--' + type} role={type === 'error' ? 'alert' : 'status'}>
    <span>{children}</span>{retry && <Button variant="ghost" onClick={retry}>Reintentar</Button>}
  </div>
}

export function SignOut() {
  const auth = useAuth()
  return <Button variant="ghost" onClick={() => void auth.signOut().catch(() => undefined)}><LogOut size={16} aria-hidden /> Cerrar sesión</Button>
}

export function Back({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="commerce-back" to={to}><ArrowLeft size={16} aria-hidden /> {children}</Link>
}

export function DetailLines({ lines }: { lines: DetailLine[] }) {
  return <ul className="commerce-lines">
    {lines.map(line => <li key={line.codigo}><span>{line.cantidad} × {line.nombre}</span><strong>{money(line.precioCentavos * line.cantidad)}</strong></li>)}
  </ul>
}

export function OrderHeader({ order }: { order: Order }) {
  const Symbol = order.estado === 'entregado' ? Check : order.estado === 'en_camino' ? Truck : order.estado === 'listo' ? PackageCheck : Clock3
  return <header className="commerce-order-heading">
    <div><h3>Pedido #{order.id}</h3><p>{order.modalidad === 'retiro' ? 'Retiro en sucursal' : 'Envío a domicilio'} · {dateLabel(order.fecha)}</p></div>
    <span className={'commerce-state commerce-state--' + order.estado}><Symbol size={15} aria-hidden /> {states[order.estado]}</span>
  </header>
}

export function OrderAmounts({ order }: { order: Order }) {
  return <>
    <DetailLines lines={order.items} />
    {order.envioCentavos > 0 && <p className="commerce-total-row"><span>Envío</span><span>{money(order.envioCentavos)}</span></p>}
    <p className="commerce-total-row commerce-total"><span>Total</span><strong>{money(order.totalCentavos)}</strong></p>
  </>
}
