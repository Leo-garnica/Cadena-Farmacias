import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../access/public'
import { Button } from '../../shared/ui/Button'
import { customerLoginPath, dateLabel, query, send, storePath, useAction, useResource, type Branch, type Identity, type Order, type Sale } from './api'
import { Back, CommerceFrame, Heading, Message, OrderAmounts, OrderHeader, SignOut } from './shared'
import { Receipt } from './Receipt'

function CustomerOrder({ order, branch, refresh, showReceipt }: { order: Order; branch?: Branch; refresh: () => void; showReceipt: (sale: Sale) => void }) {
  const action = useAction()
  const [confirming, setConfirming] = useState(false)
  const canCancel = order.estado === 'confirmado' || order.estado === 'en_preparacion' || order.estado === 'listo'
  return <article id={`pedido-${order.id}`} className="commerce-panel commerce-order">
    <OrderHeader order={order} />
    <p className="commerce-order-branch">{branch?.nombre ?? `Sucursal ${order.farmacia}`}{branch?.direccion && order.modalidad === 'retiro' ? ` · ${branch.direccion}` : ''}</p>
    {order.direccion && <p className="commerce-helper">Dirección de entrega: {order.direccion}</p>}
    {order.estado === 'listo' && order.modalidad === 'retiro' && order.codigoRetiro && <div className="commerce-pickup-code">
      <span>Presenta este código al recoger</span><strong>{order.codigoRetiro}</strong>
      {order.vence && <small>Retira tu pedido hasta {dateLabel(order.vence)}.</small>}
    </div>}
    <OrderAmounts order={order} />
    <p className="commerce-helper">{order.pago === 'revertido' ? 'Pago de prueba revertido' : 'Pago simulado confirmado'}</p>
    {action.error && <Message type="error">{action.error}</Message>}
    <div className="commerce-order-actions">
      {order.venta && <Button variant="secondary" onClick={() => showReceipt(order.venta!)}>Ver comprobante</Button>}
      {canCancel && !confirming && <Button variant="ghost" onClick={() => setConfirming(true)}>Cancelar pedido</Button>}
      {canCancel && confirming && <div className="commerce-confirm">
        <strong>¿Quieres cancelar este pedido?</strong>
        <Button variant="secondary" disabled={action.busy} onClick={() => void action.run(async () => {
          try { await send(`/pedidos/${order.id}/accion`, { accion: 'cancelar' }); setConfirming(false) }
          finally { refresh() }
        }, 'El pedido cambió de estado. Revisa si todavía se puede cancelar.')}>Confirmar cancelación</Button>
        <Button variant="ghost" onClick={() => setConfirming(false)} disabled={action.busy}>Volver</Button>
      </div>}
    </div>
  </article>
}

export function CustomerOrdersPage() {
  const auth = useAuth()
  const userId = auth.state.user?.id
  const identity = useResource<Identity>(userId ? '/identidad' : null, { scope: userId })
  const [params] = useSearchParams()
  const selected = Number(params.get('pedido'))
  const [offset, setOffset] = useState(0)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const orders = useResource<Order[]>(identity.data?.tipo === 'cliente' ? '/pedidos' + query({ offset }) : null, { scope: userId, poll: 7000 })
  const branches = useResource<Branch[]>('/sucursales', { public: true })
  useEffect(() => { document.title = 'Mis pedidos · VitaFarma' }, [])
  return <CommerceFrame area="Mis pedidos" actions={<><Link to={storePath}>Tienda</Link>{userId && <SignOut />}</>}>
    <Back to={storePath}>Volver a la tienda</Back>
    <Heading title="Mis pedidos" detail="Consulta el estado de tus compras y abre sus comprobantes." />
    {selected > 0 && orders.data?.some(order => order.id === selected && order.pago === 'simulado') && <Message type="success">Pedido #{selected} confirmado con pago de prueba.</Message>}
    {!auth.state.ready || identity.loading || orders.loading ? <Message>Cargando pedidos…</Message> : null}
    {auth.state.ready && (!userId || identity.data?.tipo === 'sin_registro') && <Link className="button button--primary" to={customerLoginPath + '?volver=pedidos'}>Ingresar a mi cuenta</Link>}
    {identity.data?.tipo === 'personal' && <Message>Para ver pedidos personales, entra con tu cuenta de cliente.</Message>}
    {identity.error && <Message type="error" retry={identity.refresh}>{identity.error}</Message>}
    {orders.error && <Message type="error" retry={orders.refresh}>{orders.error}</Message>}
    {orders.data?.length === 0 && <Message>Todavía no tienes pedidos en esta página.</Message>}
    <div className="commerce-order-grid">
      {orders.data?.map(order => <CustomerOrder key={order.id} order={order} branch={branches.data?.find(branch => branch.id === order.farmacia)} refresh={orders.refresh} showReceipt={setReceipt} />)}
    </div>
    {(offset > 0 || (orders.data?.length ?? 0) >= 60) && <div className="commerce-pagination">
      <Button variant="secondary" disabled={!offset} onClick={() => setOffset(value => Math.max(0, value - 60))}>Anterior</Button>
      <Button variant="secondary" disabled={(orders.data?.length ?? 0) < 60} onClick={() => setOffset(value => value + 60)}>Siguiente</Button>
    </div>}
    {receipt && identity.data?.tipo === 'cliente' && <Receipt sale={receipt} close={() => setReceipt(null)} />}
  </CommerceFrame>
}
