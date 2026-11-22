import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Boxes, CreditCard, MapPin, Package, Search, ShoppingBasket } from 'lucide-react'
import { useAuth } from '../access/public'
import { Button } from '../../shared/ui/Button'
import { customerLoginPath, customerOrdersPath, money, query, useCheckout, useResource, type Branch, type Identity, type Line, type Modality, type Order, type Product, type Zone } from './api'
import { CommerceFrame, Heading, Message, SignOut } from './shared'

type BasketItem = Product & { cantidad: number }
interface Draft { branch: number; items: BasketItem[]; owner: string | null }
interface Checkout { farmacia: number; modalidad: Modality; zona?: number; direccion?: string; items: Line[]; totalEsperadoCentavos: number }
const basketKey = 'vitafarma.tienda.carrito.v1'
const pageSize = 60

function loadBasket(): Draft {
  try {
    const saved = JSON.parse(sessionStorage.getItem(basketKey) ?? 'null') as Draft | null
    if (saved && Number.isSafeInteger(saved.branch) && saved.branch > 0 && Array.isArray(saved.items) &&
      saved.items.length <= 50 && (saved.owner === null || typeof saved.owner === 'string') &&
      saved.items.every(item => item && Number.isSafeInteger(item.codigo) && typeof item.nombre === 'string' &&
        Number.isSafeInteger(item.cantidad) && item.cantidad > 0 && item.cantidad <= 99 &&
        Number.isSafeInteger(item.precioCentavos) && Number.isSafeInteger(item.disponible))) return saved
  } catch { /* El carrito todavía puede usarse con el almacenamiento bloqueado. */ }
  return { branch: 0, items: [], owner: null }
}

function ProductPreview({ name }: { name: string }) {
  const [angle, setAngle] = useState(24)
  return <details className="commerce-preview">
    <summary>Ver envase 3D</summary>
    <div className="commerce-model-stage">
      <div className="commerce-model" style={{ transform: `rotateY(${angle}deg) rotateX(-8deg)` }} aria-hidden>
        <span className="commerce-model-front"><Package size={20} />{name}</span>
        <span className="commerce-model-side" />
        <span className="commerce-model-back">Envase ilustrativo</span>
      </div>
    </div>
    <label>Girar envase<input type="range" min={-130} max={130} value={angle} onChange={event => setAngle(Number(event.target.value))} /></label>
    <small>Representación ilustrativa</small>
  </details>
}

export function StorePage() {
  const auth = useAuth()
  const userId = auth.state.user?.id
  const navigate = useNavigate()
  const [draft, setDraft] = useState(loadBasket)
  const [nextBranch, setNextBranch] = useState(0)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [modality, setModality] = useState<Modality>('retiro')
  const [zoneId, setZoneId] = useState(0)
  const [address, setAddress] = useState('')
  const [notice, setNotice] = useState('')
  const action = useCheckout<Order, Checkout>('/pedidos')
  const locked = action.busy || action.pending
  const branches = useResource<Branch[]>('/sucursales', { public: true })
  const branch = branches.data?.find(option => option.id === draft.branch) ?? branches.data?.[0]
  const catalog = useResource<Product[]>(branch ? '/catalogo' + query({ farmacia: branch.id, q: search, offset }) : null, { public: true, poll: 10000 })
  const zones = useResource<Zone[]>(branch && modality === 'envio' ? '/zonas' + query({ farmacia: branch.id }) : null, { public: true })
  const identity = useResource<Identity>(userId ? '/identidad' : null, { scope: userId })
  const zone = zones.data?.find(option => option.id === zoneId)
  const items = (draft.owner === null || draft.owner === userId) && draft.branch === branch?.id ? draft.items : []
  const availableProducts = new Map(catalog.data?.map(product => [product.codigo, product]))
  const currentItems = items.map(item => ({ ...item, ...availableProducts.get(item.codigo) }))
  const subtotal = currentItems.reduce((sum, item) => sum + item.precioCentavos * item.cantidad, 0)
  const total = subtotal + (zone?.envioCentavos ?? 0)
  const unavailable = currentItems.some(item => item.disponible < item.cantidad)

  useEffect(() => { document.title = 'Tienda · VitaFarma' }, [])
  useEffect(() => {
    try { sessionStorage.setItem(basketKey, JSON.stringify(draft)) } catch { /* El carrito de esta página sigue disponible. */ }
  }, [draft])

  function changeBranch(id: number) {
    setDraft({ branch: id, items: [], owner: userId ?? null })
    setNextBranch(0)
    setOffset(0)
    setZoneId(0)
    setNotice('')
    action.clear()
  }

  function update(product: Product, quantity: number) {
    if (!branch || !Number.isInteger(quantity) || quantity < 0 || quantity > Math.min(99, product.disponible)) return
    if (quantity && !items.some(item => item.codigo === product.codigo) && items.length >= 50) {
      setNotice('Puedes agregar hasta 50 productos distintos por pedido.')
      return
    }
    const updated = items.some(item => item.codigo === product.codigo)
      ? items.map(item => item.codigo === product.codigo ? { ...product, cantidad: quantity } : item).filter(item => item.cantidad)
      : [...items, { ...product, cantidad: quantity }]
    setDraft({ branch: branch.id, items: updated, owner: userId ?? null })
    setNotice('')
    action.clear()
  }

  function finish(payload?: Checkout) {
    action.confirm(payload, order => {
      setDraft({ branch: order.farmacia, items: [], owner: userId ?? null })
      void navigate(customerOrdersPath + query({ pedido: order.id }))
    }, catalog.refresh)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!branch || !items.length || unavailable || locked) return
    if (identity.data?.tipo !== 'cliente') { void navigate(customerLoginPath); return }
    if (modality === 'envio' && (!zone || address.trim().length < 5)) return
    finish({
      farmacia: branch.id, modalidad: modality,
      ...(modality === 'envio' ? { zona: zoneId, direccion: address.trim() } : {}),
      items: items.map(({ codigo, cantidad }) => ({ codigo, cantidad })),
      totalEsperadoCentavos: total,
    })
  }

  return <CommerceFrame area="Tienda" actions={<>
    <a href="#store-cart">Carrito</a>
    <Link to={customerOrdersPath}>Mis pedidos</Link>
    {userId ? <SignOut /> : <Link to={customerLoginPath}>Iniciar sesión</Link>}
  </>}>
    <Heading title="Compra en tu farmacia" detail="Elige una sucursal para consultar disponibilidad y preparar tu pedido." />
    {branches.error && <Message type="error" retry={branches.refresh}>{branches.error}</Message>}
    <div className="commerce-store-toolbar">
      <label><span><MapPin size={16} aria-hidden /> Sucursal</span>
        <select value={branch?.id ?? ''} disabled={!branches.data?.length || locked} onChange={event => {
          const id = Number(event.target.value)
          if (items.length) setNextBranch(id)
          else changeBranch(id)
        }}>
          {!branch && <option value="">Selecciona una sucursal</option>}
          {branches.data?.map(option => <option key={option.id} value={option.id}>{option.nombre}{option.ciudad ? ` · ${option.ciudad}` : ''}</option>)}
        </select>
      </label>
      <form onSubmit={event => {
        event.preventDefault()
        setSearch(String(new FormData(event.currentTarget).get('q') ?? '').trim())
        setOffset(0)
      }} className="commerce-search">
        <label htmlFor="store-search">Buscar productos</label>
        <div><input id="store-search" name="q" type="search" maxLength={100} placeholder="Nombre o código" />
          <Button type="submit" variant="secondary" aria-label="Buscar productos"><Search size={18} aria-hidden /></Button></div>
      </form>
    </div>
    {nextBranch !== 0 && <div className="commerce-confirm">
      <p>Al cambiar de sucursal se vaciará el carrito actual.</p>
      <Button onClick={() => changeBranch(nextBranch)} disabled={locked}>Cambiar sucursal</Button>
      <Button variant="ghost" onClick={() => setNextBranch(0)}>Mantener sucursal</Button>
    </div>}
    <div className="commerce-store-layout">
      <section aria-labelledby="store-products">
        <div className="commerce-section-head"><h2 id="store-products">Productos</h2>{search && <span>Resultados para «{search}»</span>}</div>
        {catalog.loading && <Message>Consultando existencias…</Message>}
        {catalog.error && <Message type="error" retry={catalog.refresh}>{catalog.error}</Message>}
        {catalog.data?.length === 0 && <Message>{search ? 'No encontramos productos para esa búsqueda.' : 'Esta sucursal aún no tiene productos en el catálogo.'}</Message>}
        <div className="commerce-product-grid">
          {catalog.data?.map((product, index) => {
            const quantity = items.find(item => item.codigo === product.codigo)?.cantidad ?? 0
            return <article key={product.codigo} className="commerce-product">
              <div className="commerce-product-top"><span className="commerce-product-icon"><Package size={19} aria-hidden /></span>
                <span className={product.disponible ? 'commerce-available' : 'commerce-unavailable'}>{product.disponible ? `${product.disponible} disponibles` : 'Agotado'}</span></div>
              <h3>{product.nombre}</h3>
              {product.presentacion && <p>{product.presentacion}</p>}
              <div className="commerce-product-bottom">
                <strong>{money(product.precioCentavos)}</strong>
                <Button variant="secondary" aria-label={`Agregar ${product.nombre}`} disabled={!product.disponible || quantity >= Math.min(99, product.disponible) || locked} onClick={() => update(product, quantity + 1)}>
                  {quantity ? `Agregar (${quantity})` : 'Agregar'}
                </Button>
              </div>
              {index < 3 && <ProductPreview name={product.nombre} />}
            </article>
          })}
        </div>
        {(offset > 0 || (catalog.data?.length ?? 0) >= pageSize) && <div className="commerce-pagination">
          <Button variant="secondary" disabled={!offset} onClick={() => setOffset(value => Math.max(0, value - pageSize))}>Anterior</Button>
          <Button variant="secondary" disabled={(catalog.data?.length ?? 0) < pageSize} onClick={() => setOffset(value => value + pageSize)}>Siguiente</Button>
        </div>}
      </section>
      <aside className="commerce-basket commerce-panel" aria-labelledby="store-cart">
        <div className="commerce-section-head"><h2 id="store-cart"><ShoppingBasket size={22} aria-hidden /> Carrito</h2><span>{items.length} {items.length === 1 ? 'producto' : 'productos'}</span></div>
        {notice && <Message>{notice}</Message>}
        {!items.length ? <p className="commerce-empty"><Boxes size={25} aria-hidden /> Agrega un producto para comenzar.</p> : <form className="commerce-form" onSubmit={submit}>
          <ul className="commerce-lines commerce-cart-lines">
            {currentItems.map(item => <li key={item.codigo}>
              <div><strong>{item.nombre}</strong><small>{money(item.precioCentavos)} por unidad</small></div>
              <div className="commerce-stepper" role="group" aria-label={`Cantidad de ${item.nombre}`}>
                <Button variant="secondary" aria-label={`Quitar una unidad de ${item.nombre}`} disabled={locked} onClick={() => {
                  if (item.cantidad > item.disponible && item.cantidad > 1) {
                    setDraft(previous => ({ ...previous, items: previous.items.map(line => line.codigo === item.codigo ? { ...item, cantidad: item.cantidad - 1 } : line) }))
                  } else update(item, item.cantidad - 1)
                }}>−</Button>
                <span>{item.cantidad}</span>
                <Button variant="secondary" aria-label={`Añadir una unidad de ${item.nombre}`} disabled={item.cantidad >= Math.min(99, item.disponible) || locked} onClick={() => update(item, item.cantidad + 1)}>+</Button>
              </div>
            </li>)}
          </ul>
          {!action.pending && unavailable && <Message>Algunas cantidades ya no están disponibles. Ajusta el carrito para continuar.</Message>}
          <fieldset disabled={locked} className="commerce-choices">
            <legend>Cómo quieres recibirlo</legend>
            <label><input type="radio" checked={modality === 'retiro'} name="modalidad" onChange={() => setModality('retiro')} /> Retiro en sucursal</label>
            <label><input type="radio" checked={modality === 'envio'} name="modalidad" onChange={() => setModality('envio')} /> Envío a domicilio</label>
          </fieldset>
          {modality === 'envio' && <>
            <label>Zona de entrega<select required value={zoneId || ''} disabled={locked} onChange={event => setZoneId(Number(event.target.value))}>
              <option value="">Elige la zona</option>
              {zones.data?.map(option => <option key={option.id} value={option.id}>{option.nombre} · {money(option.envioCentavos)}</option>)}
            </select></label>
            {zones.error && <Message type="error" retry={zones.refresh}>{zones.error}</Message>}
            {zones.data?.length === 0 && <Message>Esta sucursal solo ofrece retiro.</Message>}
            {zone && <p className="commerce-helper">Plazo orientativo: {zone.plazo}.</p>}
            <label>Dirección de entrega<input required autoComplete="street-address" maxLength={200} minLength={5} value={address} disabled={locked} onChange={event => setAddress(event.target.value)} /></label>
          </>}
          <div className="commerce-summary">
            <p className="commerce-total-row"><span>Subtotal</span><span>{money(subtotal)}</span></p>
            <p className="commerce-total-row"><span>Envío</span><span>{modality === 'retiro' ? 'Sin cargo' : zone ? money(zone.envioCentavos) : 'Elige una zona'}</span></p>
            <p className="commerce-total-row commerce-total"><span>Total</span><strong>{money(total)}</strong></p>
          </div>
          {action.error && <Message type="error">{action.error}</Message>}
          {identity.error && <Message type="error" retry={identity.refresh}>{identity.error}</Message>}
          {action.pending ? <>
            <Message>El pago pudo haberse registrado. Verifica la misma operación antes de volver a comprar.</Message>
            <Button disabled={action.busy} onClick={() => finish()}>{action.busy ? 'Verificando…' : 'Verificar el pago'}</Button>
          </> : identity.data?.tipo === 'personal' ? <p className="commerce-helper">Usa una cuenta de cliente para comprar.</p>
            : identity.data?.tipo === 'cliente' ? <Button type="submit" disabled={action.busy || unavailable || (modality === 'envio' && !zone)}>
              <CreditCard size={18} aria-hidden /> {action.busy ? 'Confirmando…' : 'Pagar · simulación'}
            </Button>
              : <Link className="button button--primary" to={customerLoginPath}>Ingresar para comprar</Link>}
          <p className="commerce-helper">Compra de prueba. El pago es simulado.</p>
        </form>}
      </aside>
    </div>
  </CommerceFrame>
}
