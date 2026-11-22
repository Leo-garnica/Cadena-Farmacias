import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../shared/ui/Button'
import { dateLabel, money, query, roles, send, useAction, useOperationId, useResource, type SalesHistory, type Sale, type StaffApplication, type StaffBranch, type StaffMember, type StockMovement } from './api'
import { Message } from './shared'
import { Receipt } from './Receipt'

export function AccessDesk({ branch, userId }: { branch: StaffBranch; userId: string }) {
  const applications = useResource<{ solicitudes: StaffApplication[] }>('/accesos/solicitudes', { scope: userId, poll: 10000 })
  const team = useResource<{ personal: StaffMember[] }>('/accesos/personal' + query({ sucursal: branch.id }), { scope: userId })
  const action = useAction()
  const [status, setStatus] = useState('')
  const [deactivate, setDeactivate] = useState<StaffMember | null>(null)
  const pending = useMemo(
    () => applications.data?.solicitudes.filter(item => item.sucursal === branch.id && item.estado === 'pendiente'),
    [applications.data, branch.id],
  )
  const { activeEmployees, activeManagers } = useMemo(() => {
    let employees = 0
    let managers = 0
    for (const person of team.data?.personal ?? []) {
      if (!person.activo) continue
      if (person.rol === 'empleado') employees++
      else if (person.rol === 'jefe') managers++
    }
    return { activeEmployees: employees, activeManagers: managers }
  }, [team.data])

  function resolve(id: number, estado: 'aprobada' | 'rechazada') {
    void action.run(async () => {
      await send(`/accesos/solicitudes/${id}`, { estado }, 'PATCH')
      setStatus(estado === 'aprobada' ? 'Solicitud aprobada.' : 'Solicitud rechazada.')
      applications.refresh(); team.refresh()
    })
  }
  return <section aria-label="Personal y accesos">
    <header className="commerce-desk-heading"><div>
      <h2>Personal y accesos</h2>
      <p>{branch.rol === 'supervisor' ? 'Gestiona el acceso de jefes en esta sucursal.' : 'Gestiona el acceso de empleados de esta sucursal.'}</p>
    </div></header>
    {status && <Message type="success">{status}</Message>}
    {action.error && <Message type="error">{action.error}</Message>}
    <div className="commerce-desk-grid">
      <div className="commerce-panel">
        <h3>Solicitudes pendientes</h3>
        {applications.loading && <Message>Consultando solicitudes…</Message>}
        {applications.error && <Message type="error" retry={applications.refresh}>{applications.error}</Message>}
        {pending?.length === 0 && <Message>No hay solicitudes pendientes en esta sucursal.</Message>}
        <ul className="commerce-lines">
          {pending?.map(item => <li key={item.id}>
            <div><strong>{item.nombre}</strong><small>{item.correo}</small><small>{roles[item.rol]}</small></div>
            <div className="commerce-order-actions">
              <Button disabled={action.busy} onClick={() => resolve(item.id, 'aprobada')}>Aprobar</Button>
              <Button variant="secondary" disabled={action.busy} onClick={() => resolve(item.id, 'rechazada')}>Rechazar</Button>
            </div>
          </li>)}
        </ul>
      </div>
      <div className="commerce-panel">
        <h3>Personal de la sucursal</h3>
        {team.data && <p className="commerce-helper">{activeEmployees ?? 0} empleados activos · {activeManagers ?? 0} jefes activos</p>}
        {team.loading && <Message>Consultando personal…</Message>}
        {team.error && <Message type="error" retry={team.refresh}>{team.error}</Message>}
        {team.data?.personal.length === 0 && <Message>Aún no hay cuentas asignadas.</Message>}
        <ul className="commerce-lines">
          {team.data?.personal.map(person => <li key={person.sub}>
            <div><strong>{person.nombre}</strong><small>{roles[person.rol]} · {person.activo ? 'Activo' : 'Desactivado'}</small></div>
            {person.activo && person.sePuedeDesactivar && <Button variant="ghost" disabled={action.busy} onClick={() => setDeactivate(person)}>Desactivar acceso</Button>}
          </li>)}
        </ul>
        {deactivate && <div className="commerce-confirm">
          <p>¿Desactivar a <strong>{deactivate.nombre}</strong> en esta sucursal?</p>
          <Button variant="secondary" disabled={action.busy} onClick={() => void action.run(async () => {
            await send(`/accesos/personal/${deactivate.sub}`, { sucursal: branch.id, activo: false }, 'PATCH')
            setDeactivate(null)
            setStatus('Acceso desactivado.')
            team.refresh(); applications.refresh()
          })}>Confirmar</Button>
          <Button variant="ghost" onClick={() => setDeactivate(null)} disabled={action.busy}>Volver</Button>
        </div>}
      </div>
    </div>
  </section>
}

export function StockDesk({ branch, userId }: { branch: StaffBranch; userId: string }) {
  const [offset, setOffset] = useState(0)
  const movements = useResource<StockMovement[]>('/movimientos' + query({ farmacia: branch.id, offset }), { scope: userId })
  const categories = useResource<Array<{ id: number; nombre: string }>>(branch.rol === 'supervisor' ? '/categorias' : null, { scope: userId, public: true })
  const adjustment = useAction()
  const newProduct = useAction()
  const adjustmentKey = useOperationId()
  const productKey = useOperationId()
  const [status, setStatus] = useState('')

  function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const body = {
      farmacia: branch.id, codigo: Number(values.get('codigo')),
      cantidad: Number(values.get('cantidad')) * (values.get('operacion') === 'salida' ? -1 : 1),
      motivo: String(values.get('motivo') ?? '').trim(),
    }
    void adjustment.run(async () => {
      await send('/stock', { ...body, operacionId: adjustmentKey.idFor(body) })
      adjustmentKey.finish()
      form.reset(); movements.refresh()
      setStatus('Movimiento de stock registrado.')
    }, 'El ajuste dejaría menos unidades que las reservadas o supera los límites permitidos.')
  }

  function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const body = { farmacia: branch.id, categoria: Number(values.get('categoria')), nombre: String(values.get('nombre') ?? '').trim(),
      presentacion: String(values.get('presentacion') ?? '').trim(), precioCentavos: Math.round(Number(values.get('precio')) * 100) }
    void newProduct.run(async () => {
      const product = await send<{ codigo: number; nombre: string }>('/productos', { ...body, operacionId: productKey.idFor(body) })
      productKey.finish()
      form.reset()
      setStatus(`${product.nombre} · código ${product.codigo}. Usa este código para cargar unidades.`)
    }, 'Revisa si ese producto ya existe o cambió la sucursal.')
  }

  return <section aria-label="Stock y catálogo">
    <header className="commerce-desk-heading"><div><h2>Stock y catálogo</h2><p>Registra movimientos en la sucursal y revisa sus ajustes anteriores.</p></div></header>
    {status && <Message type="success">{status}</Message>}
    <div className="commerce-desk-grid">
      <div className="commerce-panel">
        <h3>Ajustar existencias</h3>
        <form onSubmit={adjust} className="commerce-form">
          <label>Código del producto<input name="codigo" type="number" min={1} max={2147483647} step={1} required /></label>
          <div className="commerce-inline">
            <label>Movimiento<select name="operacion"><option value="entrada">Entrada</option><option value="salida">Salida</option></select></label>
            <label>Unidades<input name="cantidad" type="number" min={1} step={1} max={10000} required /></label>
          </div>
          <label>Motivo<input name="motivo" minLength={3} maxLength={200} required /></label>
          {adjustment.error && <Message type="error">{adjustment.error}</Message>}
          <Button type="submit" disabled={adjustment.busy}>Registrar ajuste</Button>
        </form>
      </div>
      {branch.rol === 'supervisor' && <div className="commerce-panel">
        <h3>Nuevo producto</h3>
        <form onSubmit={createProduct} className="commerce-form">
          <label>Nombre del producto<input name="nombre" required maxLength={90} /></label>
          <label>Presentación<input name="presentacion" required maxLength={100} /></label>
          <div className="commerce-inline">
            <label>Categoría<select name="categoria" defaultValue="" required><option value="">Elige categoría</option>
              {categories.data?.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select></label>
            <label>Precio (Bs)<input name="precio" type="number" min={0.01} step={0.01} required /></label>
          </div>
          {categories.error && <Message type="error" retry={categories.refresh}>{categories.error}</Message>}
          {newProduct.error && <Message type="error">{newProduct.error}</Message>}
          <Button type="submit" disabled={newProduct.busy || !categories.data?.length}>Guardar producto</Button>
        </form>
      </div>}
    </div>
    <section className="commerce-panel commerce-table-panel" aria-labelledby="movement-title">
      <h3 id="movement-title">Ajustes registrados</h3>
      {movements.loading && <Message>Cargando ajustes…</Message>}
      {movements.error && <Message type="error" retry={movements.refresh}>{movements.error}</Message>}
      {movements.data?.length === 0 && <Message>Aún no hay ajustes registrados.</Message>}
      {!!movements.data?.length && <div className="commerce-table-scroll" tabIndex={0} role="region" aria-label="Tabla de ajustes registrados">
        <table className="commerce-table"><thead><tr><th>Fecha</th><th>Producto</th><th>Unidades</th><th>Motivo</th></tr></thead>
          <tbody>{movements.data.map(item => <tr key={item.id}><td>{dateLabel(item.fecha)}</td><td>{item.codigo}</td><td>{item.cantidad > 0 ? '+' : ''}{item.cantidad}</td><td>{item.motivo}</td></tr>)}</tbody>
        </table>
      </div>}
      {(offset > 0 || (movements.data?.length ?? 0) >= 60) && <div className="commerce-pagination">
        <Button variant="secondary" disabled={!offset} onClick={() => setOffset(value => Math.max(0, value - 60))}>Anterior</Button>
        <Button variant="secondary" disabled={(movements.data?.length ?? 0) < 60} onClick={() => setOffset(value => value + 60)}>Siguiente</Button>
      </div>}
    </section>
  </section>
}

export function HistoryDesk({ branches, userId }: { branches: StaffBranch[]; userId: string }) {
  const [filters, setFilters] = useState({ farmacia: '', desde: '', hasta: '', canal: '', estado: '' })
  const [offset, setOffset] = useState(0)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const branchNames = useMemo(() => new Map(branches.map(branch => [branch.id, branch.nombre])), [branches])
  const history = useResource<SalesHistory>('/historial' + query({ ...filters, offset }), { scope: userId })
  return <section aria-label="Historial y reportes">
    <header className="commerce-desk-heading"><div><h2>Historial de ventas</h2><p>Compara el total vendido por sucursal en el periodo que elijas.</p></div></header>
    <form className="commerce-inline commerce-list-filters" onSubmit={event => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      setFilters({ farmacia: String(data.get('farmacia')), desde: String(data.get('desde')), hasta: String(data.get('hasta')),
        canal: String(data.get('canal')), estado: String(data.get('estado')) })
      setOffset(0)
    }}>
      <label>Sucursal del historial<select name="farmacia"><option value="">Todas las autorizadas</option>
        {branches.map(branch => <option value={branch.id} key={branch.id}>{branch.nombre}</option>)}</select></label>
      <label>Desde<input type="date" name="desde" /></label>
      <label>Hasta<input type="date" name="hasta" /></label>
      <label>Canal<select name="canal"><option value="">Todos</option><option value="online">Online</option><option value="presencial">Presencial</option></select></label>
      <label>Estado de la venta<select name="estado"><option value="">Todas</option><option value="vigente">Vigente</option><option value="revertida">Revertida</option></select></label>
      <Button type="submit" variant="secondary">Aplicar filtros</Button>
    </form>
    {history.loading && <Message>Consultando ventas…</Message>}
    {history.error && <Message type="error" retry={history.refresh}>{history.error}</Message>}
    {history.data && <>
      <section className="commerce-panel" aria-label="Comparación de sucursales">
        <h3>Ventas por sucursal</h3>
        {history.data.ranking.length ? <ol className="commerce-lines commerce-ranking">
          {history.data.ranking.map(branch => <li key={branch.farmacia}>
            <div><strong>{branch.nombre}</strong><small>{branch.ventas} ventas · {branch.unidades} unidades</small></div><strong>{money(branch.totalCentavos)}</strong>
          </li>)}
        </ol> : <Message>El periodo seleccionado no tiene ventas.</Message>}
      </section>
      <section className="commerce-panel commerce-table-panel" aria-label="Listado de ventas">
        <h3>Operaciones registradas</h3>
        {history.data.ventas.length === 0 && <Message>No hay ventas en esta página.</Message>}
        {history.data.ventas.length > 0 && <div className="commerce-table-scroll" tabIndex={0} role="region" aria-label="Tabla de ventas">
          <table className="commerce-table"><thead><tr><th>Venta</th><th>Fecha</th><th>Sucursal</th><th>Canal</th><th>Empleado</th><th>Total</th><th>Comprobante</th></tr></thead>
            <tbody>{history.data.ventas.map(sale => <tr key={sale.id}>
              <th scope="row">#{sale.id}</th><td>{dateLabel(sale.fecha)}</td><td>{branchNames.get(sale.farmacia) ?? sale.farmacia}</td>
              <td>{sale.canal === 'online' ? 'Online' : 'Presencial'}</td><td>{sale.empleadoNombre ?? 'Sin registro'}</td>
              <td>{money(sale.totalCentavos)}{sale.revertida && <small> · Revertida</small>}</td>
              <td><Button variant="ghost" onClick={() => setReceipt(sale)}>Ver comprobante #{sale.id}</Button></td>
            </tr>)}</tbody>
          </table>
        </div>}
        {(offset > 0 || history.data.ventas.length >= 60) && <div className="commerce-pagination">
          <Button variant="secondary" disabled={!offset} onClick={() => setOffset(value => Math.max(0, value - 60))}>Anterior</Button>
          <Button variant="secondary" disabled={history.data.ventas.length < 60} onClick={() => setOffset(value => value + 60)}>Siguiente</Button>
        </div>}
      </section>
    </>}
    {receipt && <Receipt sale={receipt} close={() => setReceipt(null)} />}
  </section>
}
