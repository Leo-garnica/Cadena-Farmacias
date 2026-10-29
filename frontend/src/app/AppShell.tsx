import { useState } from 'react'
import { Outlet, useLoaderData, useLocation, useNavigate, useNavigation, useParams } from 'react-router'
import { ChevronRight, Menu, Store } from 'lucide-react'
import { inventoryHref, parseQuery, type InventoryMetadata } from '../modules/inventory/public'
import { Sidebar } from './Sidebar'
import { Drawer } from '../shared/ui/Drawer'
import './shell.css'

export function AppShell() {
  const metadata = useLoaderData() as InventoryMetadata
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const navigation = useNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const query = parseQuery(new URLSearchParams(location.search), metadata.farmacias.map((branch) => branch.id_farmacia), metadata.categorias.map((category) => category.id_categoria), params.idFarmacia)
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <aside className="sidebar"><Sidebar /></aside>
    <div className="app-workspace">
      <header className="workspace-header">
        <div className="workspace-breadcrumb"><button className="button button--ghost icon-button mobile-menu" id="menu-trigger" aria-label="Abrir navegación" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={21} aria-hidden="true" /></button><span>VitaFarma</span><ChevronRight size={14} aria-hidden="true" /><strong>{location.pathname.startsWith('/inventario') ? 'Inventario' : 'Consulta'}</strong></div>
        <div className="branch-control"><Store size={19} aria-hidden="true" /><div><label htmlFor="branch-select">Sucursal</label><select id="branch-select" name="farmacia" value={query.farmacia} onChange={(event) => void navigate(inventoryHref({ ...query, farmacia: Number(event.target.value), pagina: 1 }))}>{metadata.farmacias.map((branch) => <option value={branch.id_farmacia} key={branch.id_farmacia}>{branch.nombre ?? 'No registrado'}</option>)}</select></div></div>
      </header>
      <div className="navigation-status" role="status" aria-live="polite">{navigation.state !== 'idle' ? 'Actualizando consulta…' : ''}</div>
      <main id="main-content" tabIndex={-1}><Outlet /></main>
    </div>
    <Drawer open={menuOpen} onOpenChange={setMenuOpen} title="Tu espacio de trabajo" description="Navegación de VitaFarma" returnFocusId="menu-trigger" side="left"><div className="mobile-sidebar"><Sidebar onNavigate={() => setMenuOpen(false)} /></div></Drawer>
  </div>
}
