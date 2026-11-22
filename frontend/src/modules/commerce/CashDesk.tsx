import { useState, type FormEvent } from 'react'
import { ReceiptText, Search } from 'lucide-react'
import { Button } from '../../shared/ui/Button'
import { money, query, send, useAction, useCheckout, useResource, type Line, type Product, type Sale } from './api'
import { Message } from './shared'
import { Receipt } from './Receipt'

type Client = { id: number; nombre: string }
type BasketLine = Product & { cantidad: number }
interface Checkout { farmacia: number; items: Line[]; totalEsperadoCentavos: number; cliente?: number }

export function CashDesk({ branch, userId }: { branch: number; userId: string }) {
  const [productSearch, setProductSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [lines, setLines] = useState<BasketLine[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [newClient, setNewClient] = useState(false)
  const [sale, setSale] = useState<Sale | null>(null)
  const [receipt, setReceipt] = useState(false)
  const purchase = useCheckout<Sale, Checkout>('/caja')
  const locked = purchase.busy || purchase.pending
  const creation = useAction()
  const products = useResource<Product[]>('/catalogo' + query({ farmacia: branch, q: productSearch, offset }), { public: true, poll: 10000 })
  const clients = useResource<Client[]>(clientSearch ? '/caja/clientes' + query({ farmacia: branch, q: clientSearch }) : null, { scope: userId })
  const latest = new Map(products.data?.map(product => [product.codigo, product]))
  const reviewed = lines.map(line => ({ ...line, ...latest.get(line.codigo) }))
  const invalid = reviewed.some(line => !Number.isInteger(line.cantidad) || line.cantidad > Math.min(99, line.disponible) || line.cantidad < 1)
  const total = reviewed.reduce((sum, line) => sum + line.precioCentavos * line.cantidad, 0)

  function add(product: Product) {
    const quantity = lines.find(line => line.codigo === product.codigo)?.cantidad ?? 0
    if (!product.disponible || quantity >= product.disponible || quantity >= 99 || (!quantity && lines.length >= 50)) return
    setLines(previous => quantity ? previous.map(line => line.codigo === product.codigo ? { ...product, cantidad: quantity + 1 } : line) : [...previous, { ...product, cantidad: 1 }])
    purchase.clear()
  }

  function finish(payload?: Checkout) {
    purchase.confirm(payload, complete => {
      setLines([])
      setClient(null)
      setSale(complete)
      setReceipt(true)
    }, products.refresh)
  }

  function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!lines.length || invalid || locked) return
    finish({ farmacia: branch, items: lines.map(({ codigo, cantidad }) => ({ codigo, cantidad })),
      totalEsperadoCentavos: total, ...(client ? { cliente: client.id } : {}) })
  }

  function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    void creation.run(async () => {
      const result = await send<Client>('/caja/clientes', {
        farmacia: branch, nombres: String(values.get('nombres') ?? '').trim(), apellidos: String(values.get('apellidos') ?? '').trim(),
      })
      setClient(result)
      setNewClient(false)
      clients.refresh()
    })
  }

  return <section aria-label="Caja presencial">
    <header className="commerce-desk-heading"><div><h2>Caja presencial</h2><p>Consulta las existencias de esta sucursal y agrega lo que el cliente se lleva.</p></div></header>
    {sale && <Message type="success"><span>Venta #{sale.id} registrada. <button className="commerce-text-button" onClick={() => setReceipt(true)}>Ver comprobante</button></span></Message>}
    <div className="commerce-desk-grid">
      <div className="commerce-panel">
        <h3>Buscar productos</h3>
        <form className="commerce-inline" onSubmit={event => {
          event.preventDefault()
          setProductSearch(String(new FormData(event.currentTarget).get('q') ?? '').trim())
          setOffset(0)
        }}>
          <label>Nombre o código<input name="q" type="search" maxLength={100} /></label>
          <Button type="submit" variant="secondary"><Search size={16} aria-hidden /> Buscar</Button>
        </form>
        {products.loading && <Message>Consultando existencias…</Message>}
        {products.error && <Message type="error" retry={products.refresh}>{products.error}</Message>}
        {products.data?.length === 0 && <Message>No encontramos productos para esa búsqueda.</Message>}
        <ul className="commerce-lines">
          {products.data?.map(product => <li key={product.codigo}>
            <div><strong>{product.nombre}</strong><small>{money(product.precioCentavos)} · {product.disponible} disponibles</small></div>
            <Button variant="secondary" disabled={locked || !product.disponible || (lines.find(line => line.codigo === product.codigo)?.cantidad ?? 0) >= Math.min(99, product.disponible)} onClick={() => add(product)} aria-label={`Agregar ${product.nombre}`}>Agregar</Button>
          </li>)}
        </ul>
        {(offset > 0 || (products.data?.length ?? 0) >= 60) && <div className="commerce-pagination">
          <Button variant="secondary" disabled={!offset} onClick={() => setOffset(value => Math.max(0, value - 60))}>Anterior</Button>
          <Button variant="secondary" disabled={(products.data?.length ?? 0) < 60} onClick={() => setOffset(value => value + 60)}>Siguiente</Button>
        </div>}
      </div>
      <div className="commerce-panel">
        <h3>Venta actual</h3>
        {!reviewed.length && <Message>Agrega un producto antes de cobrar.</Message>}
        {reviewed.length > 0 && <ul className="commerce-lines">
          {reviewed.map(line => <li key={line.codigo}>
            <div><strong>{line.nombre}</strong><small>{money(line.precioCentavos)} por unidad</small></div>
            <label className="commerce-quantity">Cantidad<input type="number" min={1} max={Math.min(99, line.disponible)} value={line.cantidad || ''} disabled={locked} onChange={event => {
              const cantidad = Number(event.target.value)
              setLines(previous => previous.map(item => item.codigo === line.codigo ? { ...item, cantidad } : item))
              purchase.clear()
            }} /></label>
            <Button variant="ghost" disabled={locked} aria-label={`Quitar ${line.nombre}`} onClick={() => setLines(previous => previous.filter(item => item.codigo !== line.codigo))}>Quitar</Button>
          </li>)}
        </ul>}
        {!purchase.pending && invalid && <Message>Revisa las cantidades disponibles antes de cobrar.</Message>}
        <fieldset className="commerce-cash-client" disabled={locked}>
          <h3>Cliente <span className="commerce-helper">(opcional)</span></h3>
          {client ? <div className="commerce-inline">
            <strong>{client.nombre}</strong><Button variant="ghost" onClick={() => setClient(null)}>Quitar cliente</Button>
          </div> : <form className="commerce-inline" onSubmit={event => { event.preventDefault(); setClientSearch(String(new FormData(event.currentTarget).get('q') ?? '').trim()) }}>
            <label>Buscar cliente<input name="q" type="search" maxLength={100} required /></label>
            <Button type="submit" variant="secondary">Buscar ficha</Button>
          </form>}
          {!client && clients.error && <Message type="error" retry={clients.refresh}>{clients.error}</Message>}
          {!client && clients.data?.length === 0 && <Message>No encontramos fichas para esa búsqueda.</Message>}
          {!client && <ul className="commerce-lines">
            {clients.data?.map(item => <li key={item.id}>(#{item.id}) {item.nombre} <Button variant="secondary" onClick={() => setClient(item)}>Seleccionar</Button></li>)}
          </ul>}
          {!client && !newClient && <Button variant="ghost" onClick={() => setNewClient(true)}>Registrar cliente</Button>}
          {!client && newClient && <form className="commerce-form commerce-confirm" onSubmit={createClient}>
            <label>Nombres<input name="nombres" autoComplete="given-name" maxLength={60} required /></label>
            <label>Apellidos<input name="apellidos" autoComplete="family-name" maxLength={60} required /></label>
            {creation.error && <Message type="error">{creation.error}</Message>}
            <div className="commerce-inline"><Button type="submit" disabled={creation.busy}>Guardar ficha</Button><Button variant="ghost" disabled={creation.busy} onClick={() => setNewClient(false)}>Volver</Button></div>
          </form>}
        </fieldset>
        <form className="commerce-form" onSubmit={checkout}>
          <p className="commerce-total-row commerce-total"><span>Total a cobrar</span><strong>{money(total)}</strong></p>
          {purchase.error && <Message type="error">{purchase.error}</Message>}
          {purchase.pending ? <>
            <Message>La venta pudo haberse registrado. Verifica la misma operación para recuperar el comprobante.</Message>
            <Button disabled={purchase.busy} onClick={() => finish()}>{purchase.busy ? 'Verificando…' : 'Verificar la venta'}</Button>
          </> : <Button type="submit" disabled={purchase.busy || !lines.length || invalid}><ReceiptText size={18} aria-hidden /> {purchase.busy ? 'Registrando…' : 'Confirmar venta'}</Button>}
        </form>
      </div>
    </div>
    {sale && receipt && <Receipt sale={sale} close={() => setReceipt(false)} />}
  </section>
}
