import type { DateOnly } from '@vitafarma/contracts/inventory'
import type { InventoryRow } from './types'

export function quantityStatus(row: InventoryRow) {
  if (row.stock === null) return { label: 'Sin registro de stock', tone: 'neutral' as const }
  if (row.stock.cantidad === null) return { label: 'Cantidad no registrada', tone: 'neutral' as const }
  if (row.stock.cantidad === 0) return { label: 'Sin unidades', tone: 'warning' as const }
  return { label: 'Con existencias', tone: 'success' as const }
}
export function lotStatus(row: InventoryRow, referenceDate: DateOnly) {
  if (row.stock === null) return { label: 'Sin registro de stock', tone: 'neutral' as const }
  if (row.lote === null) return { label: 'Sin lote asociado', tone: 'neutral' as const }
  if (row.lote.fecha_vencimiento === null) return { label: 'Fecha no registrada', tone: 'neutral' as const }
  if (row.lote.fecha_vencimiento < referenceDate) return { label: 'Vencido', tone: 'danger' as const }
  if (row.lote.fecha_vencimiento === referenceDate) return { label: 'Vence en fecha demo', tone: 'warning' as const }
  return { label: 'Vigente', tone: 'success' as const }
}
