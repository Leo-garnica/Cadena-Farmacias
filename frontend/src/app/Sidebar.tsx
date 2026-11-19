import { Link, useLocation } from 'react-router'
import { ArrowUpRight, Boxes, ChartNoAxesCombined, ClipboardList, ReceiptText } from 'lucide-react'
import { Brand } from './Brand'

export function Sidebar({ practice, branch, onNavigate }: { practice: boolean; branch: number; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const links = [
    { label: 'Inventario', path: '/inventario', to: '/inventario?farmacia=' + branch, Icon: Boxes },
    { label: 'Indicadores', path: '/indicadores', to: '/indicadores?farmacia=' + branch, Icon: ChartNoAxesCombined },
    ...(practice ? [
      { label: 'Gestión', path: '/practica', to: '/practica/farmacias', Icon: ClipboardList },
      { label: 'Ventas', path: '/practica/ventas', to: '/practica/ventas', Icon: ReceiptText },
    ] : []),
  ]
  return <div className="sidebar-inner">
    <Link to="/" className="sidebar-brand" onClick={onNavigate} aria-label="VitaFarma, ir a la portada"><Brand /></Link>
    <div className="sidebar-label">Espacio de trabajo</div>
    <nav aria-label="Navegación principal" className="sidebar-nav">{links.map(({ label, path, to, Icon }) => {
      const active = path === '/practica' ? pathname.startsWith(path) && pathname !== '/practica/ventas' : pathname.startsWith(path)
      return <Link key={path} to={to} className={'sidebar-link' + (active ? ' sidebar-link--active' : '')} onClick={onNavigate} aria-current={active ? 'page' : undefined}>
        <Icon size={19} aria-hidden="true" /><span>{label}</span>{active && <ArrowUpRight size={16} aria-hidden="true" />}
      </Link>
    })}</nav>
  </div>
}
