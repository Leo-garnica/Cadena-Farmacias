import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import type { InventoryRow } from '@vitafarma/contracts/inventory'
import { apiRequest } from '../access/public'
import { Pager, ReferencePicker, Status } from './controls'
import { civilDate, errorMessage, money, useQuery, type Entries } from './data'
import './practice.css'

type Sale = { id_venta: number; id_farmacia: number; id_empleado: number; id_cliente: number; fecha_hora: string; total_cobrado: string | number | null }
type SaleDetail = { venta: Sale; detalles: { codigo_producto: number; nombre: string | null; cantidad: number; precio_historico: string | number | null }[] }
type CartLine = { code: number; name: string; quantity: number; cents: number }
type Selection = { kind: 'list' } | { kind: 'new' } | { kind: 'detail'; id: number }
const subtotal = (price: number | string | null, quantity: number) => price == null ? null : Math.round(Number(price) * 100) * quantity / 100

function Receipt({ id }: { id: number }) {
  const request = useQuery<SaleDetail>('/practica/ventas/' + id)
  if (!request.data) return <Status message={request.error ?? 'Cargando detalle de venta…'} retry={request.error ? request.refresh : undefined} />
  const { venta, detalles } = request.data
  return <section className="practice-panel" aria-labelledby="sale-title"><div className="practice-panel-head"><h2 id="sale-title">Venta #{venta.id_venta}</h2><strong className="practice-total">{money(venta.total_cobrado)}</strong></div>
    <dl className="practice-receipt"><div><dt>Fecha</dt><dd>{civilDate(venta.fecha_hora)}</dd></div><div><dt>Sucursal</dt><dd>#{venta.id_farmacia}</dd></div><div><dt>Empleado</dt><dd>#{venta.id_empleado}</dd></div><div><dt>Cliente</dt><dd>#{venta.id_cliente}</dd></div></dl>
    <div className="practice-table-wrap" tabIndex={0} role="region" aria-label="Productos vendidos"><table><thead><tr>{['Producto', 'Cantidad', 'Precio registrado', 'Subtotal'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
      {detalles.map(item => <tr key={item.codigo_producto}><td>{item.nombre || 'Sin nombre'} · #{item.codigo_producto}</td><td>{item.cantidad}</td><td>{money(item.precio_historico)}</td><td>{money(subtotal(item.precio_historico, item.cantidad))}</td></tr>)}
    </tbody></table></div>
  </section>
}

function SaleForm({ complete, cancel }: { complete: (id: number) => void; cancel: () => void }) {
  const [branch, setBranch] = useState('')
  const [employee, setEmployee] = useState('')
  const [customer, setCustomer] = useState('')
  const [code, setCode] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [lines, setLines] = useState<CartLine[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const transaction = useRef<string | null>(null)
  const sending = useRef(false)
  const detail = useQuery<InventoryRow>(branch && code ? `/inventory/${branch}/${code}` : null)
  const units = detail.data?.stock?.cantidad ?? null
  const price = detail.data?.producto.precio_venta ?? null
  const total = lines.reduce((sum, line) => sum + line.quantity * line.cents, 0)
  function addLine() {
    const count = Number(quantity)
    if (!detail.data || !Number.isSafeInteger(count) || count < 1 || units == null || count > units || price == null || price <= 0) {
      setError('Selecciona un producto con precio y una cantidad disponible en esta sucursal.'); return
    }
    if (lines.length >= 50 || lines.some(line => line.code === Number(code))) {
      setError('Añade hasta 50 productos distintos. Para cambiar la cantidad, quita la línea y vuelve a añadirla.'); return
    }
    setLines(previous => [...previous, { code: Number(code), name: detail.data!.producto.nombre || ('Producto #' + code), quantity: count, cents: Math.round(price * 100) }])
    setCode(''); setQuantity('1'); setError('')
  }
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (sending.current) return
    if (!branch || !employee || !customer || !lines.length) { setError('Indica la sucursal, el empleado, el cliente y al menos un producto.'); return }
    if (code) { setError('Añade el producto seleccionado o quita la selección antes de confirmar.'); return }
    sending.current = true; setBusy(true); setError('')
    transaction.current ??= crypto.randomUUID()
    try {
      const record = await apiRequest<SaleDetail>('/practica/ventas', { method: 'POST', body: JSON.stringify({
        operacionId: transaction.current, id_farmacia: Number(branch), id_empleado: Number(employee), id_cliente: Number(customer),
        items: lines.map(line => ({ codigo_producto: line.code, cantidad: line.quantity })),
      }) })
      complete(record.venta.id_venta)
    } catch (failure) {
      const unresolved = !(failure instanceof Response) || failure.status >= 500
      setUncertain(unresolved)
      if (!unresolved) transaction.current = null
      const text = await errorMessage(failure)
      setError(unresolved ? 'El servidor no confirmó el resultado. Reintenta la misma venta para recuperar su estado.' : text)
    } finally { sending.current = false; setBusy(false) }
  }
  return <section className="practice-panel" aria-labelledby="new-sale"><h2 id="new-sale">Nueva venta</h2>
    <form onSubmit={submit}><fieldset disabled={busy || uncertain} className="practice-fields"><legend className="sr-only">Datos de la venta</legend>
      <ReferencePicker label="Sucursal" reference="farmacias" value={branch} disabled={lines.length > 0} onChange={id => { setBranch(id); setEmployee(''); setCode('') }} />
      <ReferencePicker key={branch} label="Empleado" reference="empleados" branch={branch} disabled={!branch} value={employee} onChange={setEmployee} />
      <ReferencePicker label="Cliente" reference="clientes" value={customer} onChange={setCustomer} />
    </fieldset>
    <fieldset disabled={busy || uncertain || !branch} className="practice-sale-lines"><legend>Productos de la venta</legend>
      <div className="practice-line-form"><ReferencePicker label="Producto" reference="productos" required={false} value={code} onChange={setCode} />
        <div><label htmlFor="sale-count">Cantidad</label><input id="sale-count" type="number" min="1" step="1" max={units ?? undefined} value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
        <button type="button" className="practice-button" disabled={!detail.data || units == null || units < 1 || price == null || price <= 0} onClick={addLine}><Plus size={16} aria-hidden="true" />Añadir producto</button></div>
      {detail.error ? <Status message={detail.error} retry={detail.refresh} /> : detail.loading ? <Status message="Consultando existencias…" /> : detail.data && <p className="practice-help" role="status">Existencias: {detail.data.stock ? (units ?? 'Cantidad sin registrar') : 'Sin registro'}. Precio: {money(price)}.</p>}
      {lines.length > 0 && <><ul className="practice-cart">{lines.map(line => <li key={line.code}><div><strong>{line.name}</strong><span>{line.quantity} × {money(line.cents / 100)}</span></div>
        <strong>{money(line.cents * line.quantity / 100)}</strong><button className="practice-text is-danger-text" type="button" aria-label={`Quitar ${line.name}`} onClick={() => setLines(lines.filter(item => item.code !== line.code))}><Trash2 size={16} aria-hidden="true" />Quitar</button></li>)}</ul>
        <p className="practice-total">Total estimado <strong>{money(total / 100)}</strong></p></>}
    </fieldset>
    {error && <p className="practice-error" role="alert">{error}</p>}
    <div className="practice-actions"><button type="submit" className="practice-button is-primary" disabled={busy || !lines.length}><Check size={16} aria-hidden="true" />{busy ? 'Registrando…' : uncertain ? 'Reintentar la misma venta' : 'Confirmar venta'}</button>
      <button type="button" className="practice-button" onClick={cancel} disabled={busy}>{uncertain ? 'Revisar historial' : 'Cancelar'}</button></div>
    </form>
  </section>
}

export function PracticeSalesPage() {
  const [selection, setSelection] = useState<Selection>({ kind: 'list' })
  const [offset, setOffset] = useState(0)
  const list = useQuery<Entries<Sale>>(selection.kind === 'list' ? '/practica/ventas?offset=' + offset : null)
  const goBack = () => { setSelection({ kind: 'list' }); list.refresh() }
  return <div className="practice"><header className="practice-heading"><h1>Ventas</h1><p>Registra ventas y consulta las líneas cobradas en el entorno de práctica.</p></header>
    {selection.kind === 'list' ? <><Link className="practice-text" to="/practica"><ArrowLeft size={15} aria-hidden="true" />Gestión de registros</Link><section className="practice-panel"><div className="practice-panel-head"><h2>Historial</h2>{list.data && <button className="practice-button is-primary" onClick={() => setSelection({ kind: 'new' })}><Plus size={16} aria-hidden="true" />Nueva venta</button>}</div>
      {list.error ? <Status message={list.error} retry={list.refresh} /> : !list.data ? <Status message="Cargando ventas…" /> : <>
        {list.data.filas.length ? <div className="practice-table-wrap" role="region" aria-label="Historial de ventas" tabIndex={0}><table><thead><tr>{['Venta', 'Fecha', 'Sucursal', 'Total cobrado'].map(c => <th scope="col" key={c}>{c}</th>)}</tr></thead><tbody>{list.data.filas.map(row =>
          <tr key={row.id_venta}><td><button className="practice-text" onClick={() => setSelection({ kind: 'detail', id: row.id_venta })}>Ver venta #{row.id_venta}</button></td><td>{civilDate(row.fecha_hora)}</td><td>#{row.id_farmacia}</td><td>{money(row.total_cobrado)}</td></tr>)}</tbody></table></div> : <p className="practice-empty">Todavía no hay ventas registradas.</p>}
        <Pager offset={offset} total={list.data.total} length={list.data.filas.length} change={setOffset} /></>}
      </section></> : <>{selection.kind === 'detail' && <button className="practice-text" onClick={goBack}><ArrowLeft size={15} aria-hidden="true" />Volver al historial</button>}
        {selection.kind === 'detail' ? <Receipt id={selection.id} /> : <SaleForm cancel={goBack} complete={id => setSelection({ kind: 'detail', id })} />}</>}
  </div>
}
