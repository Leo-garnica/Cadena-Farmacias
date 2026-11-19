import { useEffect, useState } from 'react'
import { Outlet, useLoaderData, useLocation, useNavigate, useNavigation, useParams } from 'react-router'
import { ChevronRight, Menu, Store } from 'lucide-react'
import { inventoryHref, parseQuery, type InventoryMetadata } from '../modules/inventory/public'
import { Sidebar } from './Sidebar'
import { Drawer } from '../shared/ui/Drawer'
import { SessionControls } from '../modules/access/public'
import { AsyncState } from '../shared/ui/AsyncState'
import './shell.css'

export function AppShell() {
  const metadata = useLoaderData() as InventoryMetadata & { practice: boolean }
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const navigation = useNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const report = location.pathname === '/indicadores'
  const practice = location.pathname.startsWith('/practica')
  const section = report ? 'Indicadores' : practice ? 'Gestión de práctica' : 'Inventario'
  useEffect(() => { document.title = section + ' · VitaFarma' }, [section])
  const query = parseQuery(new URLSearchParams(location.search), metadata.farmacias.map((branch) => branch.id_farmacia), metadata.categorias.map((category) => category.id_categoria), params.idFarmacia)
  function changeBranch(branch: number) {
    if (!report) { void navigate(inventoryHref({ ...query, farmacia: branch, pagina: 1 })); return }
    const search = new URLSearchParams(location.search)
    search.set('farmacia', String(branch))
    void navigate('/indicadores?' + search)
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <aside className="sidebar"><Sidebar practice={metadata.practice} branch={query.farmacia} /></aside>
    <div className="app-workspace">
      <header className="workspace-header">
        <div className="workspace-breadcrumb"><button className="button button--ghost icon-button mobile-menu" id="menu-trigger" aria-label="Abrir navegación" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={21} aria-hidden="true" /></button><span>VitaFarma</span><ChevronRight size={14} aria-hidden="true" /><strong>{section}</strong></div>
        {!practice && <div className="branch-control"><Store size={19} aria-hidden="true" /><div><label htmlFor="branch-select">Sucursal</label><select id="branch-select" name="farmacia" value={query.farmacia} onChange={(event) => changeBranch(Number(event.target.value))}>{metadata.farmacias.map((branch) => <option value={branch.id_farmacia} key={branch.id_farmacia}>{branch.nombre ?? 'No registrado'}</option>)}</select></div></div>}
      </header>
      <div className="workspace-session"><span>{practice ? 'Base local de práctica' : 'Consulta por sucursal'}</span><SessionControls /></div>
      <div className="navigation-status" role="status" aria-live="polite">{navigation.state !== 'idle' ? 'Actualizando consulta…' : ''}</div>
      <main id="main-content" tabIndex={-1}>{practice && !metadata.practice
        ? <AsyncState kind="error" title="Gestión no disponible" description="Las operaciones requieren una cuenta responsable y el entorno local de gestión." />
        : <Outlet />}</main>
    </div>
    <Drawer open={menuOpen} onOpenChange={setMenuOpen} title="Tu espacio de trabajo" description="Navegación de VitaFarma" returnFocusId="menu-trigger" side="left"><div className="mobile-sidebar"><Sidebar practice={metadata.practice} branch={query.farmacia} onNavigate={() => setMenuOpen(false)} /></div></Drawer>
  </div>
}
