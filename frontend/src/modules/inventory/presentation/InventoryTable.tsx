import { Link, useLocation } from 'react-router'
import { ArrowUpRight, Pill, Package } from 'lucide-react'
import type { DateOnly } from '@vitafarma/contracts/inventory'
import { formatDate, formatNumber, NOT_RECORDED } from '../../../shared/lib/formatters'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { queryParams } from '../application/query'
import { lotStatus, quantityStatus } from '../domain/status'
import type { InventoryQuery, InventoryRow } from '../domain/types'

export function InventoryTable({ rows, query, referenceDate }: { rows: InventoryRow[]; query: InventoryQuery; referenceDate: DateOnly }) {
  const location = useLocation()
  return <div className="table-scroll" role="region" aria-label="Tabla de inventario" tabIndex={0}>
    <table className="inventory-table" role="table"><caption className="sr-only">Productos de la sucursal. Cantidades y vencimientos con referencia al {formatDate(referenceDate)}.</caption>
      <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Producto</th><th scope="col" role="columnheader">Categoría</th><th scope="col" role="columnheader">Cantidad</th><th scope="col" role="columnheader">Lote asociado</th><th scope="col" role="columnheader">Vencimiento</th><th scope="col" role="columnheader"><span className="sr-only">Detalle</span></th></tr></thead>
      <tbody role="rowgroup">{rows.map((row) => {
        const quantity = quantityStatus(row)
        const lot = lotStatus(row, referenceDate)
        const Icon = row.medicamento ? Pill : Package
        const linkId = `detail-${row.farmacia.id_farmacia}-${row.producto.codigo_producto}`
        return <tr key={row.producto.codigo_producto} role="row">
          <th scope="row" role="rowheader" className="product-cell"><div className="product-identity"><span className={`product-icon ${row.medicamento ? '' : 'product-icon--care'}`}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /></span><div><span className="product-name">{row.producto.nombre ?? NOT_RECORDED}</span><span className="product-presentation">{row.producto.presentacion ?? NOT_RECORDED}</span><span className="product-code">Código <span className="numeric">{row.producto.codigo_producto}</span></span></div></div></th>
          <td role="cell" className="category-cell"><span className="mobile-label" aria-hidden="true">Categoría</span>{row.categoria?.nombre ?? NOT_RECORDED}</td>
          <td role="cell" className="quantity-cell"><span className="mobile-label" aria-hidden="true">Cantidad</span>{row.stock === null ? <span className="quantity-absent">Sin registro de stock</span> : <><span className={`quantity-value numeric ${row.stock.cantidad === null ? 'quantity-value--null' : ''}`}>{row.stock.cantidad === null ? NOT_RECORDED : formatNumber(row.stock.cantidad)}</span>{row.stock.cantidad !== null ? <StatusBadge tone={quantity.tone}>{quantity.label}</StatusBadge> : null}</>}</td>
          <td role="cell" className="lot-cell"><span className="mobile-label" aria-hidden="true">Lote asociado</span><span>{row.lote?.codigo_alfanumerico ?? NOT_RECORDED}</span>{row.stock !== null && row.lote === null ? <small>Sin lote asociado</small> : null}</td>
          <td role="cell" className="expiry-cell"><span className="mobile-label" aria-hidden="true">Vencimiento</span><span className="numeric">{formatDate(row.lote?.fecha_vencimiento ?? null)}</span>{row.lote !== null ? <StatusBadge tone={lot.tone}>{lot.label}</StatusBadge> : null}</td>
          <td role="cell" className="detail-cell"><Link className="detail-link" id={linkId} to={`/inventario/${query.farmacia}/${row.producto.codigo_producto}?${queryParams(query)}`} state={{ inventoryOrigin: location.pathname + location.search, returnFocusId: linkId }} aria-label={`Ver detalle de ${row.producto.nombre ?? row.producto.codigo_producto}`}><span>Ver detalle</span><ArrowUpRight size={15} aria-hidden="true" /></Link></td>
        </tr>
      })}</tbody>
    </table>
  </div>
}
