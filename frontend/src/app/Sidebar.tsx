import { Link, useLocation } from 'react-router'
import { Boxes, BookOpen, Truck, ChartNoAxesCombined, Sprout, ArrowUpRight } from 'lucide-react'
import { Brand } from './Brand'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  return <div className="sidebar-inner">
    <Link to="/inventario" className="sidebar-brand" onClick={onNavigate} aria-label="VitaFarma, ir a Inventario"><Brand /></Link>
    <div className="sidebar-label">Espacio de trabajo</div>
    <nav aria-label="Navegación principal" className="sidebar-nav">
      <Link to="/inventario" className="sidebar-link sidebar-link--active" aria-current={location.pathname.startsWith('/inventario') ? 'page' : undefined} onClick={onNavigate}><Boxes size={19} aria-hidden="true" /><span>Inventario</span><ArrowUpRight size={16} aria-hidden="true" /></Link>
      {[
        { name: 'Catálogo', Icon: BookOpen }, { name: 'Proveedores', Icon: Truck }, { name: 'Reportes', Icon: ChartNoAxesCombined },
      ].map(({ name, Icon }) => <div className="sidebar-future" key={name}><Icon size={19} aria-hidden="true" /><span>{name}<small>Próximamente</small></span></div>)}
    </nav>
    <div className="sidebar-bottom"><Sprout size={27} strokeWidth={1.4} aria-hidden="true" /><p>Cuidar empieza<br />por el orden.</p><span>Piloto de inventario</span><div className="sidebar-local"><span aria-hidden="true" />Entorno local de demostración</div></div>
  </div>
}
