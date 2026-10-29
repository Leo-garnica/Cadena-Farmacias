import { Link, Outlet, useLoaderData, useNavigation, useRouteLoaderData } from 'react-router'
import { CalendarDays, ChevronLeft, ChevronRight, FlaskConical, Info } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { formatDate, formatNumber } from '../../../shared/lib/formatters'
import { AsyncState } from '../../../shared/ui/AsyncState'
import { motionTiming } from '../../../shared/motion/presets'
import { InventorySummary } from './InventorySummary'
import { InventoryFilters } from './InventoryFilters'
import { InventoryTable } from './InventoryTable'
import { inventoryHref } from '../application/query'
import type { InventoryMetadata, InventoryResult } from '../domain/types'
import './inventory.css'

export function InventoryPage() {
  const result = useLoaderData() as InventoryResult
  const metadata = useRouteLoaderData('app') as InventoryMetadata
  const navigation = useNavigation()
  const reduced = useReducedMotion()
  const { query, rows, summary, total, pageCount, pageSize } = result
  const branch = metadata.farmacias.find((item) => item.id_farmacia === query.farmacia)
  return <>
    <div className="inventory-heading"><div><h1 id="inventory-title" tabIndex={-1}>Inventario</h1><p>Una mirada clara a cada producto, en cada sucursal.</p></div><div className="heading-context"><div className="demo-badge"><FlaskConical size={14} aria-hidden="true" />Datos simulados · Solo consulta</div><div className="reference-date"><CalendarDays size={17} aria-hidden="true" /><div><span>Fecha de referencia demo</span><strong>{formatDate(metadata.referenceDate)}</strong></div></div></div></div>
    <InventorySummary summary={summary} />
    <section className="inventory-ledger" aria-labelledby="stock-title">
      <div className="ledger-heading"><div><h2 id="stock-title">Existencias de {branch?.nombre ?? 'la sucursal'}</h2><p>Consulta productos, cantidades y su lote asociado.</p></div><span className="product-count">{formatNumber(total)} productos</span></div>
      <InventoryFilters query={query} categories={metadata.categorias} />
      <div className="sr-only" aria-live="polite" aria-atomic="true">{navigation.state === 'idle' ? `${total} productos. Página ${query.pagina} de ${pageCount}.` : 'Actualizando resultados…'}</div>
      <m.div className="inventory-results" aria-busy={navigation.state !== 'idle'} animate={{ opacity: navigation.state === 'idle' ? 1 : 0.55 }} transition={{ duration: reduced ? 0 : motionTiming.feedback }}>
        {rows.length ? <InventoryTable rows={rows} query={query} referenceDate={metadata.referenceDate} /> : <AsyncState kind="empty" title="No encontramos productos" description="Prueba otro nombre o código, o limpia los filtros para ver todos los productos de esta sucursal." action={<Link className="button button--secondary" to={inventoryHref({ ...query, q: '', categoria: null, estado: 'todos', pagina: 1 })}>Limpiar filtros</Link>} />}
      </m.div>
      <div className="inventory-pagination"><p className="numeric">{total ? `${formatNumber((query.pagina - 1) * pageSize + 1)}–${formatNumber(Math.min(query.pagina * pageSize, total))} de ${formatNumber(total)} productos` : '0 productos'}</p><nav aria-label="Páginas del inventario">
        {query.pagina > 1 ? <Link className="button button--secondary icon-button" aria-label="Página anterior" to={inventoryHref({ ...query, pagina: query.pagina - 1 })}><ChevronLeft size={17} aria-hidden="true" /></Link> : <button className="button button--secondary icon-button" aria-label="Página anterior" disabled><ChevronLeft size={17} aria-hidden="true" /></button>}
        <span className="numeric">Página <strong>{query.pagina}</strong> de {pageCount}</span>
        {query.pagina < pageCount ? <Link className="button button--secondary icon-button" aria-label="Página siguiente" to={inventoryHref({ ...query, pagina: query.pagina + 1 })}><ChevronRight size={17} aria-hidden="true" /></Link> : <button className="button button--secondary icon-button" aria-label="Página siguiente" disabled><ChevronRight size={17} aria-hidden="true" /></button>}
      </nav></div>
    </section>
    <footer className="inventory-footer"><Info size={15} aria-hidden="true" /><p>Las cantidades corresponden a la presentación de cada producto. Los vencimientos se comparan con el {formatDate(metadata.referenceDate)}.</p><span translate="no">VitaFarma</span></footer>
    <Outlet />
  </>
}
