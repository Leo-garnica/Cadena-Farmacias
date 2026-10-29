import type { DateOnly, InventoryOrder, InventoryRow, InventoryStatus, InventorySummaryData } from '@vitafarma/contracts/inventory'

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })
export function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim()
}
export function isExpired(row: InventoryRow, referenceDate: DateOnly) {
  return row.lote?.fecha_vencimiento != null && row.lote.fecha_vencimiento < referenceDate
}
export function matchesStatus(row: InventoryRow, status: InventoryStatus, referenceDate: DateOnly): boolean {
  switch (status) {
    case 'con-existencias': return row.stock?.cantidad != null && row.stock.cantidad > 0
    case 'sin-unidades': return row.stock?.cantidad === 0
    case 'sin-cantidad': return row.stock !== null && row.stock.cantidad === null
    case 'sin-registro': return row.stock === null
    case 'sin-lote': return row.stock !== null && row.stock.id_lote === null
    case 'vencido': return isExpired(row, referenceDate)
    case 'todos': return true
  }
}
export function compareRows(a: InventoryRow, b: InventoryRow, order: InventoryOrder): number {
  let result: number
  switch (order) {
    case 'codigo-asc': result = a.producto.codigo_producto - b.producto.codigo_producto; break
    case 'cantidad-desc': result = (b.stock?.cantidad ?? -1) - (a.stock?.cantidad ?? -1); break
    case 'vencimiento-asc': result = collator.compare(a.lote?.fecha_vencimiento ?? '9999-12-31', b.lote?.fecha_vencimiento ?? '9999-12-31'); break
    default: result = collator.compare(a.producto.nombre ?? '\uffff', b.producto.nombre ?? '\uffff') * (order === 'nombre-desc' ? -1 : 1)
  }
  return result || a.producto.codigo_producto - b.producto.codigo_producto
}
export function summarize(rows: InventoryRow[], referenceDate: DateOnly): InventorySummaryData {
  return rows.reduce<InventorySummaryData>((summary, row) => ({
    registros: summary.registros + Number(row.stock !== null),
    conExistencias: summary.conExistencias + Number(matchesStatus(row, 'con-existencias', referenceDate)),
    sinUnidades: summary.sinUnidades + Number(matchesStatus(row, 'sin-unidades', referenceDate)),
    sinCantidad: summary.sinCantidad + Number(matchesStatus(row, 'sin-cantidad', referenceDate)),
    sinRegistro: summary.sinRegistro + Number(row.stock === null),
    vencidos: summary.vencidos + Number(isExpired(row, referenceDate)),
  }), { registros: 0, conExistencias: 0, sinUnidades: 0, sinCantidad: 0, sinRegistro: 0, vencidos: 0 })
}
