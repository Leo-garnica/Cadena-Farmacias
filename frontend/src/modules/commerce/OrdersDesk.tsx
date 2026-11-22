import { useState, type FormEvent } from 'react'
import { Inbox } from 'lucide-react'
import { Button } from '../../shared/ui/Button'
import { query, send, useAction, useResource, type Order, type OrderAction, type StaffMember, type StaffRole } from './api'
import { Message, OrderAmounts, OrderHeader } from './shared'

type PendingAction = 'entregar' | 'liberar' | 'cancelar' | 'reasignar' | 'devolver'

function WorkOrder({ order, userId, staffRole, refresh }: { order: Order; userId: string; staffRole: StaffRole; refresh: () => void }) {
  const action = useAction()
  const [dialog, setDialog] = useState<PendingAction | null>(null)
  const mine = order.asignado === userId
  const manage = staffRole !== 'empleado'
  const mayWork = staffRole !== 'supervisor'
  const inProgress = order.estado !== 'entregado' && order.estado !== 'devuelto'
  const team = useResource<{ personal: StaffMember[] }>(dialog === 'reasignar' ? '/accesos/personal' + query({ sucursal: order.farmacia }) : null, { scope: userId })
  const operators = team.data?.personal.filter(person => person.activo && person.rol !== 'supervisor' && person.sub !== order.asignado) ?? []

  function apply(name: OrderAction, fields: Record<string, string> = {}) {
    void action.run(async () => {
      try {
        await send(`/pedidos/${order.id}/accion`, { accion: name, ...fields })
        setDialog(null)
      } finally { refresh() }
    }, name === 'tomar' ? 'Este pedido ya lo está preparando otra persona. La bandeja se actualizó.'
      : name === 'entregar' ? 'No se pudo verificar el código o el estado del pedido cambió. Revísalo.'
      : 'El pedido cambió mientras lo tenías abierto. Revisa su estado y vuelve a intentarlo.')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dialog) return
    const fields = Object.fromEntries(Array.from(new FormData(event.currentTarget), ([key, value]) => [key, String(value).trim()]))
    apply(dialog, fields)
  }

  return <article className="commerce-order commerce-panel">
    <OrderHeader order={order} />
    {order.asignado && <p className="commerce-helper">{mine ? 'A tu cargo' : 'Asignado a otra persona'}</p>}
    {order.direccion && <p className="commerce-helper">Dirección de entrega: {order.direccion}</p>}
    <OrderAmounts order={order} />
    {action.error && <Message type="error">{action.error}</Message>}
    {!dialog && <div className="commerce-order-actions">
      {mayWork && order.estado === 'confirmado' && <Button disabled={action.busy} onClick={() => apply('tomar')}>Tomar pedido</Button>}
      {mayWork && mine && order.estado === 'en_preparacion' && <Button disabled={action.busy} onClick={() => apply('preparar')}>Marcar como listo</Button>}
      {mayWork && mine && order.estado === 'listo' && order.modalidad === 'envio' && <Button disabled={action.busy} onClick={() => apply('despachar')}>Despachar</Button>}
      {mayWork && mine && order.estado === 'listo' && order.modalidad === 'retiro' && <Button disabled={action.busy} onClick={() => setDialog('entregar')}>Registrar retiro</Button>}
      {mayWork && mine && order.estado === 'en_camino' && <Button disabled={action.busy} onClick={() => apply('entregar')}>Confirmar entrega</Button>}
      {mayWork && mine && order.estado === 'en_preparacion' && <Button variant="ghost" disabled={action.busy} onClick={() => setDialog('liberar')}>Devolver a la cola</Button>}
      {manage && inProgress && order.asignado && <Button variant="secondary" disabled={action.busy} onClick={() => setDialog('reasignar')}>Reasignar</Button>}
      {manage && inProgress && order.estado !== 'en_camino' && <Button variant="ghost" disabled={action.busy} onClick={() => setDialog('cancelar')}>Cancelar pedido</Button>}
      {manage && (order.estado === 'en_camino' || order.estado === 'entregado') && <Button variant="ghost" disabled={action.busy} onClick={() => setDialog('devolver')}>Registrar devolución</Button>}
    </div>}
    {dialog && <form className="commerce-form commerce-confirm" onSubmit={submit}>
      {dialog === 'entregar' ? <label>Código de retiro<input name="codigoRetiro" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required /></label>
        : <>
          {dialog === 'reasignar' && <label>Persona responsable<select name="empleadoSub" defaultValue="" required>
            <option value="">Selecciona a una persona</option>
            {operators.map(person => <option key={person.sub} value={person.sub}>{person.nombre}</option>)}
          </select></label>}
          {dialog === 'reasignar' && team.error && <Message type="error" retry={team.refresh}>{team.error}</Message>}
          {dialog === 'devolver' && <p>Confirma la recepción física de los productos antes de revertir el pedido y devolver las unidades al stock.</p>}
          <label>Motivo<input name="motivo" required minLength={3} maxLength={200} /></label>
        </>}
      <div className="commerce-order-actions">
        <Button type="submit" disabled={action.busy || (dialog === 'reasignar' && !operators.length)}>
          {dialog === 'entregar' ? 'Confirmar retiro' : dialog === 'liberar' ? 'Devolver a la cola' : dialog === 'reasignar' ? 'Confirmar reasignación'
            : dialog === 'devolver' ? 'Confirmar devolución' : 'Confirmar cancelación'}
        </Button>
        <Button variant="ghost" onClick={() => setDialog(null)} disabled={action.busy}>Volver</Button>
      </div>
    </form>}
  </article>
}

export function OrdersDesk({ branch, userId, staffRole }: { branch: number; userId: string; staffRole: StaffRole }) {
  const [ownOnly, setOwnOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [outgoing, setOutgoing] = useState(false)
  const orders = useResource<Order[]>('/cola' + query({ farmacia: branch, offset, finalizados: outgoing ? 1 : undefined }), { scope: userId, poll: 5000 })
  const [seen, setSeen] = useState<number[]>([])
  const feed = orders.data ?? []
  const newest = feed.filter(order => order.estado === 'confirmado' && !seen.includes(order.id)).length
  const visible = feed.filter(order => (!ownOnly || order.asignado === userId) && (!search || String(order.id).includes(search)))
  return <section aria-label="Bandeja de pedidos">
    <header className="commerce-desk-heading">
      <div><h2>Pedidos de la sucursal</h2><p>Revisa los pedidos más antiguos y toma el que vas a preparar.</p></div>
      <Button variant="secondary" onClick={orders.refresh}>Actualizar</Button>
    </header>
    {newest > 0 && <Message><span className="commerce-inbox"><Inbox size={18} aria-hidden />
      {newest === 1 ? '1 pedido pendiente de tomar' : `${newest} pedidos pendientes de tomar`}
      <button className="commerce-text-button" onClick={() => setSeen(previous => [...previous, ...feed.filter(order => order.estado === 'confirmado').map(order => order.id)])}>Marcar como visto</button>
    </span></Message>}
    <div className="commerce-inline commerce-list-filters">
      <label>Buscar número de pedido<input type="search" value={search} onChange={event => setSearch(event.target.value.trim())} /></label>
      {staffRole !== 'supervisor' && <label className="commerce-check"><input type="checkbox" checked={ownOnly} onChange={event => setOwnOnly(event.target.checked)} /> Solo a mi cargo</label>}
      {staffRole !== 'empleado' && <label className="commerce-check">
        <input type="checkbox" checked={outgoing} onChange={event => { setOutgoing(event.target.checked); setOwnOnly(false); setOffset(0) }} /> Salidas y devoluciones
      </label>}
    </div>
    {orders.loading && <Message>Cargando pedidos…</Message>}
    {orders.error && <Message type="error" retry={orders.refresh}>{orders.error}</Message>}
    {orders.data && !visible.length && <Message>No hay pedidos que coincidan.</Message>}
    <div className="commerce-order-grid">
      {visible.map(order => <WorkOrder key={order.id} order={order} userId={userId} staffRole={staffRole} refresh={orders.refresh} />)}
    </div>
    {(offset > 0 || feed.length >= 60) && <div className="commerce-pagination">
      <Button variant="secondary" disabled={!offset} onClick={() => setOffset(value => Math.max(0, value - 60))}>Anterior</Button>
      <Button variant="secondary" disabled={feed.length < 60} onClick={() => setOffset(value => value + 60)}>Siguiente</Button>
    </div>}
  </section>
}
