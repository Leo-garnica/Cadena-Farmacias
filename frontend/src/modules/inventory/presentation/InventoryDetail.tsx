import { Link, useLoaderData, useLocation, useNavigate, useRouteLoaderData } from 'react-router'
import { Info, Package, Pill, CalendarDays } from 'lucide-react'
import { Drawer } from '../../../shared/ui/Drawer'
import { Tabs } from '../../../shared/ui/Tabs'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { AsyncState } from '../../../shared/ui/AsyncState'
import { formatDate, formatMoney, formatNumber, NOT_RECORDED } from '../../../shared/lib/formatters'
import { inventoryHref } from '../application/query'
import { lotStatus, quantityStatus } from '../domain/status'
import type { InventoryMetadata, InventoryResult, InventoryRow } from '../domain/types'

export function InventoryDetail() {
  const row = useLoaderData() as InventoryRow | null
  const { query } = useRouteLoaderData('inventory') as InventoryResult
  const { referenceDate } = useRouteLoaderData('app') as InventoryMetadata
  const location = useLocation()
  const navigate = useNavigate()
  const origin = location.state as { inventoryOrigin?: string; returnFocusId?: string } | null
  const returnTo = inventoryHref(query)
  const close = () => { if (origin?.inventoryOrigin?.startsWith('/inventario?')) void navigate(-1); else void navigate(returnTo, { replace: true }) }
  const tab = new URLSearchParams(location.search).get('tab') === 'lote' ? 'lote' : 'producto'
  const setTab = (value: string) => {
    const params = new URLSearchParams(location.search)
    if (value === 'lote') params.set('tab', 'lote'); else params.delete('tab')
    void navigate(`${location.pathname}?${params}`, { replace: true, state: location.state, preventScrollReset: true })
  }
  const quantity = row ? quantityStatus(row) : null
  const lot = row ? lotStatus(row, referenceDate) : null
  const Icon = row?.medicamento ? Pill : Package
  return <Drawer open onOpenChange={(open) => { if (!open) close() }} title="Detalle de inventario" description="Datos simulados · Solo consulta" returnFocusId={origin?.returnFocusId}>
    {row && quantity && lot ? <>
      <div className="detail-product"><span className="detail-product__icon"><Icon size={27} strokeWidth={1.4} aria-hidden="true" /></span><p>{row.medicamento ? 'Medicamento' : 'Producto no medicamento'}</p><h2>{row.producto.nombre ?? NOT_RECORDED}</h2><span>{row.producto.presentacion ?? NOT_RECORDED}</span><div className="detail-identifiers"><span>Código {row.producto.codigo_producto}</span><span>Sucursal {row.farmacia.nombre ?? NOT_RECORDED}</span></div></div>
      <div className="detail-quantity"><div><span>Cantidad registrada</span><strong className="numeric">{row.stock === null ? 'Sin registro de stock' : row.stock.cantidad === null ? NOT_RECORDED : formatNumber(row.stock.cantidad)}</strong></div><StatusBadge tone={quantity.tone}>{quantity.label}</StatusBadge></div>
      <Tabs label="Información del inventario" value={tab} onValueChange={setTab} items={[
        { value: 'producto', label: 'Producto', content: <>
          <dl className="detail-fields"><div><dt>Categoría</dt><dd>{row.categoria?.nombre ?? NOT_RECORDED}</dd></div><div><dt>Presentación</dt><dd>{row.producto.presentacion ?? NOT_RECORDED}</dd></div><div><dt>Precio de venta demo</dt><dd>{formatMoney(row.producto.precio_venta)}</dd></div><div><dt>Descripción</dt><dd>{row.producto.descripcion ?? NOT_RECORDED}</dd></div></dl>
          <div className="detail-note"><Info size={18} aria-hidden="true" /><p>{row.stock === null ? 'Este producto existe en el catálogo demo, pero no tiene un registro de stock en esta sucursal. No equivale a una cantidad de cero.' : row.stock.cantidad === null ? 'El registro de stock existe, pero su cantidad no está registrada. No se interpreta como cero.' : 'La cantidad corresponde a la presentación indicada. Esta consulta no permite registrar movimientos.'}</p></div>
        </> },
        { value: 'lote', label: 'Lote asociado', content: row.lote ? <>
          <div className="lot-status"><CalendarDays size={19} aria-hidden="true" /><StatusBadge tone={lot.tone}>{lot.label}</StatusBadge></div>
          <dl className="detail-fields"><div><dt>Código de lote</dt><dd>{row.lote.codigo_alfanumerico ?? NOT_RECORDED}</dd></div><div><dt>Fecha de fabricación</dt><dd>{formatDate(row.lote.fecha_fabricacion)}</dd></div><div><dt>Fecha de vencimiento</dt><dd>{formatDate(row.lote.fecha_vencimiento)}</dd></div><div><dt>Fecha de referencia demo</dt><dd>{formatDate(referenceDate)}</dd></div></dl>
          <div className="detail-note"><Info size={18} aria-hidden="true" /><p>Se muestra el único lote asociado a este registro. El vencimiento es informativo; no establece una regla de bloqueo de venta.</p></div>
        </> : <div className="no-lot"><Package size={30} strokeWidth={1.4} aria-hidden="true" /><h3>{row.stock === null ? 'Sin registro de stock' : 'Sin lote asociado'}</h3><p>{row.stock === null ? 'No hay un registro de stock para relacionar con un lote en esta sucursal.' : 'El registro de stock existe, pero no tiene un lote asociado. Las fechas se muestran como No registrado.'}</p><dl className="detail-fields"><div><dt>Lote</dt><dd>{NOT_RECORDED}</dd></div><div><dt>Fecha de vencimiento</dt><dd>{NOT_RECORDED}</dd></div></dl></div> },
      ]} />
      <div className="detail-footer"><span>Referencia demo: {formatDate(referenceDate)}</span><button className="button button--secondary" onClick={close}>Volver al inventario</button></div>
    </> : <AsyncState kind="not-found" title="Registro no encontrado" description="La sucursal o el producto de esta dirección no existe en los datos simulados." action={<Link className="button button--primary" to={returnTo} replace>Volver al inventario</Link>} />}
  </Drawer>
}
