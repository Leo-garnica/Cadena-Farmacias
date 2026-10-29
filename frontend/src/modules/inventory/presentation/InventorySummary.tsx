import { PackageCheck, PackageX, CircleHelp, CalendarClock } from 'lucide-react'
import { formatNumber } from '../../../shared/lib/formatters'
import type { InventorySummaryData } from '../domain/types'

export function InventorySummary({ summary }: { summary: InventorySummaryData }) {
  return <section className="inventory-summary" aria-label="Resumen del conjunto filtrado">
    <dl>
      <div className="summary-primary"><dt><PackageCheck size={18} aria-hidden="true" />Registros de stock</dt><dd data-testid="summary-records">{formatNumber(summary.registros)}</dd><span>{formatNumber(summary.conExistencias)} con existencias</span></div>
      <div><dt><PackageX size={17} aria-hidden="true" />Sin unidades</dt><dd className="summary-warning" data-testid="summary-zero">{formatNumber(summary.sinUnidades)}</dd><span>Cantidad igual a cero</span></div>
      <div><dt><CircleHelp size={17} aria-hidden="true" />Cantidad no registrada</dt><dd data-testid="summary-null">{formatNumber(summary.sinCantidad)}</dd><span>Existencia por confirmar</span></div>
      <div><dt><CalendarClock size={17} aria-hidden="true" />Con lote vencido</dt><dd className="summary-danger" data-testid="summary-expired">{formatNumber(summary.vencidos)}</dd><span>Según la fecha demo</span></div>
    </dl>
    <div className="summary-footnote"><span>{formatNumber(summary.sinRegistro)} productos sin registro de stock en esta consulta.</span><span>Indicadores por registro, no por unidades.</span></div>
  </section>
}
