import { memo, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowDown, Box, Check, ChevronDown, CircleDot, CreditCard, Grid2X2, MapPin, Milk, Package, Plus, Search, ShoppingBag, SlidersHorizontal, Trash2, UserRound, X } from 'lucide-react'
import { useAuth } from '../access/public'
import { Button } from '../../shared/ui/Button'
import { customerLoginPath, customerOrdersPath, money, query, useCheckout, useResource, type Branch, type Identity, type Line, type Modality, type Order, type Product, type Zone } from './api'
import { productMedia } from './product-media'
import { Message, SignOut } from './shared'
import './storefront.css'

type BasketItem = Product & { cantidad: number }
interface Draft { branch: number; items: BasketItem[]; owner: string | null }
interface Checkout { farmacia: number; modalidad: Modality; zona?: number; direccion?: string; items: Line[]; totalEsperadoCentavos: number }
const basketKey = 'vitafarma.tienda.carrito.v1'
const pageSize = 60
const emptyItems: BasketItem[] = []
const quickSearches = [
  { label: 'Todos', term: '', Icon: Grid2X2 },
  { label: 'Cajas', term: 'Caja', Icon: Box },
  { label: 'Frascos', term: 'Frasco', Icon: Milk },
  { label: 'Tubos', term: 'Tubo', Icon: Package },
  { label: 'Rollos', term: 'Rollo', Icon: CircleDot },
] as const

const ProductCard = memo(function ProductCard({
  product, quantity, locked, priority, onAdd,
}: {
  product: Product
  quantity: number
  locked: boolean
  priority: boolean
  onAdd: (product: Product, nextQuantity: number) => void
}) {
  const media = productMedia(product)
  const limitReached = !product.disponible || quantity >= Math.min(99, product.disponible) || locked
  return <article className="vf-product">
    <div className="vf-product-media">
      <img
        src={media.src}
        alt=""
        width={media.width}
        height={media.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    </div>
    <div className="vf-product-body">
      <span className="vf-presentation">{product.presentacion ?? 'Producto'}</span>
      <h3>{product.nombre}</h3>
      <span className={'vf-stock' + (!product.disponible ? ' vf-sold-out' : '')}>
        {product.disponible ? `${product.disponible} disponible${product.disponible === 1 ? '' : 's'}` : 'Agotado'}
      </span>
      <div className="vf-buy">
        <strong>{money(product.precioCentavos)}</strong>
        <Button
          variant="secondary"
          aria-label={`Agregar ${product.nombre}`}
          disabled={limitReached}
          onClick={() => onAdd(product, quantity + 1)}
        >
          {quantity ? <Check size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
          {quantity ? `Agregar (${quantity})` : 'Agregar'}
        </Button>
      </div>
    </div>
  </article>
})

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

export function StorePage() {
  const auth = useAuth()
  const userId = auth.state.user?.id
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const cartOpen = params.get('carrito') === '1'
  const catalogHeading = useRef<HTMLHeadingElement>(null)
  const cartTitle = useRef<HTMLHeadingElement>(null)
  const [draft, setDraft] = useState(loadBasket)
  const [nextBranch, setNextBranch] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [offset, setOffset] = useState(0)
  const [modality, setModality] = useState<Modality>('retiro')
  const [zoneId, setZoneId] = useState(0)
  const [address, setAddress] = useState('')
  const [notice, setNotice] = useState('')
  const action = useCheckout<Order, Checkout>('/pedidos')
  const { clear: clearAction } = action
  const locked = action.busy || action.pending
  const branches = useResource<Branch[]>('/sucursales', { public: true })
  const branchById = useMemo(() => new Map(branches.data?.map(option => [option.id, option])), [branches.data])
  const branch = branchById.get(draft.branch) ?? branches.data?.[0]
  const branchId = branch?.id
  const catalogPath = useMemo(
    () => (branchId ? '/catalogo' + query({ farmacia: branchId, q: search, offset }) : null),
    [branchId, search, offset],
  )
  const zonesPath = useMemo(
    () => (branchId && modality === 'envio' ? '/zonas' + query({ farmacia: branchId }) : null),
    [branchId, modality],
  )
  const catalog = useResource<Product[]>(catalogPath, { public: true, poll: 10000 })
  const zones = useResource<Zone[]>(zonesPath, { public: true })
  const identity = useResource<Identity>(userId ? '/identidad' : null, { scope: userId })
  const zone = useMemo(
    () => (modality === 'envio' ? zones.data?.find(option => option.id === zoneId) : undefined),
    [modality, zones.data, zoneId],
  )
  const items = useMemo(
    () => ((draft.owner === null || draft.owner === userId) && draft.branch === branchId ? draft.items : emptyItems),
    [draft.owner, draft.branch, draft.items, userId, branchId],
  )
  const itemQuantities = useMemo(() => new Map(items.map(item => [item.codigo, item.cantidad])), [items])
  const units = useMemo(() => items.reduce((sum, item) => sum + item.cantidad, 0), [items])
  const availableProducts = useMemo(() => new Map(catalog.data?.map(product => [product.codigo, product])), [catalog.data])
  const products = useMemo(
    () => catalog.data?.slice().sort((a, b) => Number(b.disponible > 0) - Number(a.disponible > 0)),
    [catalog.data],
  )
  const currentItems = useMemo(
    () => items.map(item => ({ ...item, ...availableProducts.get(item.codigo) })),
    [items, availableProducts],
  )
  const subtotal = useMemo(() => currentItems.reduce((sum, item) => sum + item.precioCentavos * item.cantidad, 0), [currentItems])
  const total = subtotal + (zone?.envioCentavos ?? 0)
  const unavailable = useMemo(() => currentItems.some(item => item.disponible < item.cantidad), [currentItems])

  const persistedDraft = useMemo(
    () => (userId && identity.data?.tipo === 'cliente' && draft.owner === null && draft.items.length
      ? { ...draft, owner: userId }
      : draft),
    [draft, identity.data?.tipo, userId],
  )

  useEffect(() => { document.title = 'VitaFarma · Farmacia en línea' }, [])
  useEffect(() => {
    try { sessionStorage.setItem(basketKey, JSON.stringify(persistedDraft)) } catch { /* El carrito de esta página sigue disponible. */ }
  }, [persistedDraft])

  const showCart = useCallback((open: boolean) => {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (open) next.set('carrito', '1')
      else next.delete('carrito')
      return next
    }, { replace: true, preventScrollReset: true })
  }, [setParams])

  const findProducts = useCallback((term: string, moveToResults = false) => {
    setSearchInput(term)
    setSearch(term.trim())
    setOffset(0)
    if (moveToResults) catalogHeading.current?.focus()
  }, [])

  const changeBranch = useCallback((id: number) => {
    setDraft({ branch: id, items: [], owner: userId ?? null })
    setNextBranch(0)
    setOffset(0)
    setZoneId(0)
    setAddress('')
    setNotice('')
    clearAction()
  }, [userId, clearAction])

  const update = useCallback((product: Product, quantity: number) => {
    if (!branchId || locked || !Number.isInteger(quantity) || quantity < 0) return
    const previous = itemQuantities.get(product.codigo) ?? 0
    if (quantity > previous && quantity > Math.min(99, product.disponible)) return
    if (quantity && !previous && items.length >= 50) {
      setNotice('Puedes agregar hasta 50 productos distintos por pedido.')
      return
    }
    const updated = previous
      ? items.map(item => (item.codigo === product.codigo ? { ...product, cantidad: quantity } : item)).filter(item => item.cantidad)
      : [...items, { ...product, cantidad: quantity }]
    setDraft({ branch: branchId, items: updated, owner: userId ?? null })
    setNotice(quantity === 0 ? `${product.nombre} se quitó del carrito.` : `${product.nombre} · ${quantity} en tu carrito.`)
    clearAction()
  }, [branchId, locked, itemQuantities, items, userId, clearAction])

  function finish(payload?: Checkout) {
    action.confirm(payload, order => {
      setDraft({ branch: order.farmacia, items: [], owner: userId ?? null })
      void navigate(customerOrdersPath + query({ pedido: order.id }))
    }, catalog.refresh)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!branch || !items.length || unavailable || locked) return
    if (identity.data?.tipo !== 'cliente') { void navigate(customerLoginPath + '?volver=carrito'); return }
    if (modality === 'envio' && (!zone || address.trim().length < 5)) return
    finish({
      farmacia: branch.id, modalidad: modality,
      ...(modality === 'envio' ? { zona: zoneId, direccion: address.trim() } : {}),
      items: items.map(({ codigo, cantidad }) => ({ codigo, cantidad })),
      totalEsperadoCentavos: total,
    })
  }

  return <Dialog.Root open={cartOpen} onOpenChange={showCart}><div className="vf-store">
    <a className="skip-link" href="#store-products">Saltar al catálogo</a>
    <header className="vf-mast">
      <div className="vf-wrap vf-mast-row">
        <Link to="/" className="vf-brand" aria-label="VitaFarma, inicio"><span aria-hidden="true">✚</span>VitaFarma</Link>
        <form role="search" className="vf-search" onSubmit={event => { event.preventDefault(); findProducts(searchInput, true) }}>
          <label className="sr-only" htmlFor="store-search">Buscar productos</label>
          <input id="store-search" type="search" placeholder="Busca por nombre o código" maxLength={100}
            value={searchInput} onChange={event => setSearchInput(event.target.value)} />
          <button type="submit" aria-label="Buscar productos"><Search size={21} aria-hidden /></button>
        </form>
        <nav aria-label="Cuenta y compras" className="vf-actions">
          <Link to={userId ? customerOrdersPath : customerLoginPath}><UserRound size={20} aria-hidden /><span>{userId ? 'Mis pedidos' : 'Mi cuenta'}</span></Link>
          <Dialog.Trigger className="vf-cart-trigger">
            <ShoppingBag size={19} aria-hidden /><span>Carrito</span><strong>{units}</strong>
          </Dialog.Trigger>
        </nav>
      </div>
      <div className="vf-location"><div className="vf-wrap vf-location-row">
        <label className="vf-branch"><MapPin size={17} aria-hidden /><span className="sr-only">Sucursal de compra</span>
          <select value={branch?.id ?? ''} disabled={!branches.data?.length || locked} onChange={event => {
            const id = Number(event.target.value)
            if (items.length) setNextBranch(id)
            else changeBranch(id)
          }}>
            {!branch && <option value="">{branches.loading ? 'Buscando sucursales…' : 'Selecciona una sucursal'}</option>}
            {branches.data?.map(option => <option key={option.id} value={option.id}>{option.nombre}{option.ciudad ? ` · ${option.ciudad}` : ''}</option>)}
          </select><ChevronDown size={15} aria-hidden />
        </label>
        {!userId && <Link to={customerOrdersPath} className="vf-track">Seguir mis pedidos</Link>}
      </div></div>
    </header>
    <main className="vf-wrap vf-main">
      {branches.error && <Message type="error" retry={branches.refresh}>{branches.error}</Message>}
      {branches.data?.length === 0 && <Message>Por el momento no hay sucursales habilitadas para comprar.</Message>}
      {nextBranch !== 0 && <div className="commerce-confirm" role="alert">
        <p>Al cambiar a {branchById.get(nextBranch)?.nombre} se vaciará tu carrito de {branch?.nombre}.</p>
        <Button onClick={() => changeBranch(nextBranch)} disabled={locked}>Cambiar sucursal</Button>
        <Button variant="ghost" onClick={() => setNextBranch(0)}>Mantener sucursal</Button>
      </div>}
      <section className="vf-hero" aria-labelledby="vf-title">
        <div className="vf-hero-copy"><h1 id="vf-title">Tu farmacia<br />en línea.</h1>
          <p>Elige tus productos para retirar en sucursal o recibir en casa.</p>
          <a href="#store-products">Ver productos <ArrowDown size={16} aria-hidden /></a>
        </div>
        <picture className="vf-hero-picture">
          <source srcSet="/images/mostrador.webp" type="image/webp" />
          <img src="/images/mostrador.jpg" alt="" width="1448" height="1086" fetchPriority="high" decoding="async" />
        </picture>
      </section>
      <section aria-labelledby="store-products" className="vf-catalog">
        <div className="vf-catalog-head">
          <div><h2 id="store-products" ref={catalogHeading} tabIndex={-1}>{search ? 'Resultados de búsqueda' : 'Catálogo de la sucursal'}</h2>
            <p>{search ? `Productos que coinciden con «${search}»` : branch?.nombre}</p></div>
          <div className="vf-quick" role="group" aria-label="Búsquedas por presentación">
            {quickSearches.map(({ label, term, Icon }) => <button key={label} aria-pressed={term === search}
              onClick={() => findProducts(term)}><Icon size={16} aria-hidden />{label}</button>)}
          </div>
        </div>
        <div className={items.length >= 50 ? 'commerce-helper' : 'sr-only'} role="status">{notice}</div>
        {catalog.loading && <Message>Consultando existencias…</Message>}
        {catalog.error && <Message type="error" retry={catalog.refresh}>{catalog.error}</Message>}
        {catalog.data?.length === 0 && <div className="vf-no-results"><SlidersHorizontal size={25} aria-hidden />
          <p>{search ? 'No encontramos productos para esa búsqueda.' : offset ? 'Llegaste al final del catálogo.' : 'Esta sucursal aún no tiene productos en el catálogo.'}</p>
          {search && <Button variant="secondary" onClick={() => findProducts('')}>Ver todos los productos</Button>}</div>}
        <div className="vf-grid">
          {products?.map((product, index) => (
            <ProductCard
              key={product.codigo}
              product={product}
              quantity={itemQuantities.get(product.codigo) ?? 0}
              locked={locked}
              priority={index < 4}
              onAdd={update}
            />
          ))}
        </div>
        {(offset > 0 || (catalog.data?.length ?? 0) >= pageSize) && <div className="commerce-pagination">
          <Button variant="secondary" disabled={!offset} onClick={() => setOffset(value => Math.max(0, value - pageSize))}>Anterior</Button>
          <Button variant="secondary" disabled={(catalog.data?.length ?? 0) < pageSize} onClick={() => setOffset(value => value + pageSize)}>Siguiente</Button>
        </div>}
      </section>
    </main>
    <footer className="vf-footer"><div className="vf-wrap"><span>VitaFarma</span>{userId && <SignOut />}</div></footer>
    <Dialog.Portal>
      <Dialog.Overlay className="drawer-overlay" />
      <Dialog.Content className="drawer drawer--right vf-cart-panel" onOpenAutoFocus={event => {
        event.preventDefault()
        cartTitle.current?.focus()
      }}>
        <div className="drawer__heading">
          <div><Dialog.Title ref={cartTitle} tabIndex={-1}>Tu carrito</Dialog.Title>
            <Dialog.Description>{[branch?.nombre, `${units} ${units === 1 ? 'unidad' : 'unidades'}`].filter(Boolean).join(' · ')}</Dialog.Description></div>
          <Dialog.Close className="button button--ghost icon-button" aria-label="Cerrar carrito"><X size={20} aria-hidden /></Dialog.Close>
        </div>
        <div className="drawer__body">
          <div className="vf-cart">
            {notice && <p className="vf-cart-notice" role="status">{notice}</p>}
            {!items.length ? <div className="vf-empty-cart"><ShoppingBag size={35} aria-hidden />
              <h3>Tu carrito está vacío</h3><p>Agrega un producto del catálogo para comenzar.</p>
              <Button onClick={() => showCart(false)}>Volver al catálogo</Button></div> : <form className="commerce-form" onSubmit={submit}>
              <ul className="commerce-lines commerce-cart-lines">
                {currentItems.map(item => <li key={item.codigo}>
                  <div><strong>{item.nombre}</strong><small>{money(item.precioCentavos)} por unidad</small>
                    <button type="button" className="vf-remove" aria-label={`Eliminar ${item.nombre} del carrito`} disabled={locked} onClick={() => update(item, 0)}>
                      <Trash2 size={14} aria-hidden />Eliminar</button>
                  </div>
                  <div className="commerce-stepper" role="group" aria-label={`Cantidad de ${item.nombre}`}>
                    <Button variant="secondary" aria-label={`Quitar una unidad de ${item.nombre}`} disabled={locked} onClick={() => update(item, item.cantidad - 1)}>−</Button>
                    <span>{item.cantidad}</span>
                    <Button variant="secondary" aria-label={`Añadir una unidad de ${item.nombre}`} disabled={item.cantidad >= Math.min(99, item.disponible) || locked} onClick={() => update(item, item.cantidad + 1)}>+</Button>
                  </div>
                </li>)}
              </ul>
              {!action.pending && unavailable && <Message>Algunas cantidades ya no están disponibles. Ajusta el carrito para continuar.</Message>}
              {identity.data?.tipo === 'cliente' && <fieldset disabled={locked} className="commerce-choices">
                <legend>Cómo quieres recibirlo</legend>
                <label><input type="radio" checked={modality === 'retiro'} name="modalidad" onChange={() => setModality('retiro')} /> Retiro en sucursal</label>
                <label><input type="radio" checked={modality === 'envio'} name="modalidad" onChange={() => setModality('envio')} /> Envío a domicilio</label>
              </fieldset>}
              {identity.data?.tipo === 'cliente' && modality === 'envio' && <>
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
                {identity.data?.tipo === 'cliente' && <>
                  <p className="commerce-total-row"><span>Envío</span><span>{modality === 'retiro' ? 'Sin cargo' : zone ? money(zone.envioCentavos) : 'Elige una zona'}</span></p>
                  <p className="commerce-total-row commerce-total"><span>Total</span><strong>{money(total)}</strong></p>
                </>}
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
                  : <Link className="button button--primary" to={customerLoginPath + '?volver=carrito'}>Ingresar para comprar</Link>}
              <p className="commerce-helper">Compra de prueba. El pago es simulado.</p>
            </form>}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </div></Dialog.Root>
}
