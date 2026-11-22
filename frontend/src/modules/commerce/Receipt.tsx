import { useEffect, useRef } from 'react'
import { Printer, ReceiptText } from 'lucide-react'
import { Button } from '../../shared/ui/Button'
import { dateLabel, money, type Sale } from './api'
import { DetailLines } from './shared'

export function Receipt({ sale, close }: { sale: Sale; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const subtotal = sale.items.reduce((sum, line) => sum + line.precioCentavos * line.cantidad, 0)
  const shipping = sale.totalCentavos - subtotal
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => { element?.close() }
  }, [])
  return <dialog ref={dialog} className="commerce-receipt" aria-labelledby="commerce-receipt-title" onCancel={event => { event.preventDefault(); close() }}>
    <div className="commerce-receipt-content">
      <div className="commerce-section-head">
        <h2 id="commerce-receipt-title"><ReceiptText size={21} aria-hidden /> Comprobante #{sale.id}</h2>
      </div>
      <p>VitaFarma · Sucursal {sale.farmacia}</p>
      <p>{dateLabel(sale.fecha)} · {sale.canal === 'online' ? 'Compra online' : 'Venta presencial'}</p>
      {sale.revertida && <strong>Venta revertida</strong>}
      <DetailLines lines={sale.items} />
      {shipping > 0 && <p className="commerce-total-row"><span>Envío</span><span>{money(shipping)}</span></p>}
      <p className="commerce-total-row commerce-total"><span>Total cobrado</span><strong>{money(sale.totalCentavos)}</strong></p>
      <p className="commerce-helper">Comprobante interno de práctica.</p>
    </div>
    <div className="commerce-receipt-actions">
      <Button variant="secondary" onClick={close}>Cerrar comprobante</Button>
      <Button onClick={() => window.print()}><Printer size={17} aria-hidden /> Imprimir</Button>
    </div>
  </dialog>
}
