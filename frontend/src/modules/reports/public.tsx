import { Form, Link, useLoaderData, useRouteLoaderData, useSearchParams } from 'react-router'
import { ArrowUpRight, Boxes, CalendarClock, PackageX } from 'lucide-react'
import type { InventoryMetadata, InventoryReport, InventoryStatus } from '@vitafarma/contracts/inventory'
import { formatDate, formatNumber } from '../../shared/lib/formatters'
import { inventoryHref, parseQuery } from '../inventory/public'
import './reports.css'

const indicators = [
  { field: 'registros', label: 'Registros de stock', detail: 'Productos con un saldo registrado en la sucursal.', status: 'con-registro', Icon: Boxes },
  { field: 'sinUnidades', label: 'Sin unidades', detail: 'Registros cuya cantidad es exactamente cero.', status: 'sin-unidades', Icon: PackageX },
  { field: 'vencidos', label: 'Con lote vencido', detail: 'Registros con un lote que venció antes de la fecha de consulta.', status: 'vencido', Icon: CalendarClock },
] as const satisfies ReadonlyArray<{ field: keyof Pick<InventoryReport, 'registros' | 'sinUnidades' | 'vencidos'>; label: string; detail: string; status: InventoryStatus; Icon: typeof Boxes }>

export function ReportsPage() {
  const report = useLoaderData() as InventoryReport
  const { farmacias, categorias } = useRouteLoaderData('app') as InventoryMetadata
  const [params] = useSearchParams()
  const branch = farmacias.find(f => f.id_farmacia === report.farmacia)
  const query = parseQuery(params, farmacias.map(f => f.id_farmacia), categorias.map(c => c.id_categoria))
  function inventoryLink(status: InventoryStatus) {
    return inventoryHref({ ...query, farmacia: report.farmacia, estado: status, orden: 'nombre-asc', pagina: 1 })
  }
  return <section className="reports-page" aria-labelledby="report-title">
    <h1 id="report-title">Indicadores de inventario</h1>
    <p>{branch?.nombre ?? 'Sucursal asignada'} · Fecha de consulta <time dateTime={report.referenceDate}>{formatDate(report.referenceDate)}</time></p>
    <Form method="get" className="report-filter" key={params.toString()} aria-label="Filtros de indicadores">
      <input type="hidden" name="farmacia" value={report.farmacia} />
      <label>Producto<input name="q" type="search" maxLength={100} defaultValue={params.get('q') ?? ''} placeholder="Nombre o código…" /></label>
      <label>Categoría<select name="categoria" defaultValue={params.get('categoria') ?? ''}><option value="">Todas las categorías</option>
        {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre ?? 'Sin nombre'}</option>)}</select></label>
      <button type="submit" className="button button--primary">Aplicar filtros</button>
    </Form>
    <div className="report-ledger">{indicators.map(({ field, label, detail, status, Icon }) =>
      <Link key={field} to={inventoryLink(status)} className="report-row" aria-label={`${label}: ${report[field]}. Ver registros`}>
        <Icon size={24} aria-hidden="true" /><div><h2>{label}</h2><p>{detail}</p></div>
        <strong>{formatNumber(report[field])}</strong><ArrowUpRight size={19} aria-hidden="true" />
      </Link>
    )}</div>
  </section>
}
