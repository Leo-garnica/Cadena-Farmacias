import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { parseEnv } from 'node:util'

const state = join(homedir(), '.vitafarma', 'practica-v1')
const authOrigin = 'http://127.0.0.1:55433'
const apiOrigin = 'http://127.0.0.1:3000/api/v1'
const env = parseEnv(await readFile(join(state, 'frontend.comercio.env.local'), 'utf8'))
const credentials = JSON.parse(await readFile(join(state, 'cuentas.comercio.json'), 'utf8'))
assert.equal(env.VITE_SUPABASE_URL, authOrigin)
assert.equal(env.VITE_VITAFARMA_COMERCIO, '1')

async function auth(path, body) {
  const response = await fetch(authOrigin + '/auth/v1' + path, {
    method: 'POST', redirect: 'error',
    headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(12_000), body: JSON.stringify(body),
  })
  assert.ok(response.ok, 'Auth local respondió ' + response.status)
  const result = await response.json()
  assert.ok(result.access_token, 'La identidad local necesita una sesión')
  return result.access_token
}

const signIn = email => auth('/token?grant_type=password', { email, password: credentials[email] })
const signUp = () => auth('/signup', { email: `prueba-${randomUUID()}@vitafarma.test`, password: randomUUID() })

async function invoke(path, token, body, method = body ? 'POST' : 'GET') {
  const headers = { accept: 'application/json' }
  if (token) headers.authorization = 'Bearer ' + token
  if (body) headers['content-type'] = 'application/json'
  const response = await fetch(apiOrigin + '/comercio' + path, {
    method, headers, redirect: 'error', signal: AbortSignal.timeout(15_000),
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: response.status, data: await response.json() }
}

async function api(path, token, body, status = body ? 201 : 200, method) {
  const response = await invoke(path, token, body, method)
  assert.equal(response.status, status, `${method ?? (body ? 'POST' : 'GET')} ${path} (${response.data.code ?? response.status})`)
  return response.data
}

const centro = 1
const norte = 2
const codigo = 104
const available = async () => {
  const rows = await api('/catalogo?farmacia=1&q=104')
  return rows.find(row => row.codigo === codigo).disponible
}
const lines = cantidad => [{ codigo, cantidad }]
const operation = (farmacia, cantidad) => ({ operacionId: randomUUID(), farmacia, items: lines(cantidad) })
const action = (id, accion, extra) => [`/pedidos/${id}/accion`, { accion, ...extra }]

test('roles de comercio asignados por departamento y sucursal, sin modificar la entrega académica', async () => {
  const [candidate, supervisor, otherSupervisor, boss, customer] = await Promise.all([
    signUp(), signIn('supervisor@vitafarma.test'), signIn('supervisor.sucre@vitafarma.test'),
    signIn('jefe.centro@vitafarma.test'), signIn('cliente@vitafarma.test'),
  ])
  const request = { nombre: 'Persona de integración', sucursal: centro, rol: 'empleado' }
  const entry = await api('/accesos/solicitudes', candidate, request)
  await api('/accesos/solicitudes', customer, request, 403)
  const path = '/accesos/solicitudes/' + entry.id
  await api(path, supervisor, { estado: 'aprobada' }, 403, 'PATCH')
  await api(path, otherSupervisor, { estado: 'aprobada' }, 403, 'PATCH')
  await api(path, boss, { estado: 'aprobada' }, 200, 'PATCH')
  const identity = await api('/identidad', candidate)
  assert.equal(identity.tipo, 'personal')
  assert.deepEqual(identity.sucursales.map(({ id, rol }) => [id, rol]), [[centro, 'empleado']])
  await api('/cola?farmacia=2', candidate, undefined, 403)
  await api('/cola?farmacia=1', candidate)
  const members = await api('/accesos/personal?sucursal=1', boss)
  const person = (members.personal ?? members).find(member => member.nombre === request.nombre && member.activo)
  assert.ok(person)
  await api('/accesos/personal/' + person.sub, boss, { sucursal: centro, activo: false }, 200, 'PATCH')
  await api('/cola?farmacia=1', candidate, undefined, 403)
  const newManager = await signUp()
  const managerRequest = await api('/accesos/solicitudes', newManager, { ...request, nombre: 'Jefatura de integración', rol: 'jefe' })
  const managerPath = '/accesos/solicitudes/' + managerRequest.id
  await api(managerPath, otherSupervisor, { estado: 'aprobada' }, 403, 'PATCH')
  await api(managerPath, boss, { estado: 'aprobada' }, 403, 'PATCH')
  await api(managerPath, supervisor, { estado: 'aprobada' }, 200, 'PATCH')
  const manager = await api('/identidad', newManager)
  assert.deepEqual(manager.sucursales.map(({ id, rol }) => [id, rol]), [[centro, 'jefe']])
  const legacy = await fetch(apiOrigin + '/practica/recursos', { headers: { authorization: 'Bearer ' + supervisor } })
  assert.equal(legacy.status, 403)
  const oldInventory = await fetch(apiOrigin + '/inventory?farmacia=2', { headers: { authorization: 'Bearer ' + supervisor } })
  assert.equal(oldInventory.status, 403)
})

test('pago simulado, reservas, toma concurrente, retiro, envío y reporte con stock compartido', async () => {
  const [shopper, cashier, boss, supervisor] = await Promise.all([
    signIn('cliente@vitafarma.test'), signIn('caja.centro@vitafarma.test'),
    signIn('jefe.centro@vitafarma.test'), signIn('supervisor@vitafarma.test'),
  ])
  const candidate = await signUp()
  await api('/clientes', candidate, { nombre: 'Cliente de integración' })
  const branches = await api('/sucursales')
  assert.ok(branches.some(branch => branch.id === centro))
  assert.ok(branches.some(branch => branch.id === norte))
  const initial = await available()
  const adjustment = { operacionId: randomUUID(), farmacia: centro, codigo, cantidad: 3, motivo: 'Recepción sintética de integración' }
  await api('/stock', supervisor, adjustment)
  assert.equal(await available(), initial + 3)
  await api('/caja', supervisor, operation(centro, 1), 403)

  const toReserve = await available()
  if (toReserve <= 50) {
    const contenders = await Promise.all([
      invoke('/pedidos', shopper, { ...operation(centro, toReserve), modalidad: 'retiro' }),
      invoke('/pedidos', candidate, { ...operation(centro, toReserve), modalidad: 'retiro' }),
    ])
    assert.deepEqual(contenders.map(result => result.status).sort(), [201, 409])
    const won = contenders[0].status === 201 ? 0 : 1
    assert.equal(await available(), 0)
    await api('/caja', cashier, operation(centro, 1), 409)
    const [cancelPath, cancel] = action(contenders[won].data.id, 'cancelar')
    await api(cancelPath, won === 0 ? shopper : candidate, cancel)
    assert.equal(await available(), toReserve)
  }

  const orderBody = { ...operation(centro, 1), modalidad: 'retiro' }
  const order = await api('/pedidos', shopper, orderBody)
  assert.equal(order.pago, 'simulado')
  assert.equal((await api('/pedidos', shopper, orderBody)).id, order.id)
  assert.equal(await available(), initial + 2)
  assert.equal((await api('/pedidos', candidate)).some(p => p.id === order.id), false)
  const [takePath, take] = action(order.id, 'tomar')
  const contenders = await Promise.all([invoke(takePath, cashier, take), invoke(takePath, boss, take)])
  assert.deepEqual(contenders.map(result => result.status).sort(), [201, 409])
  const winner = contenders[0].status === 201 ? cashier : boss
  const [readyPath, ready] = action(order.id, 'preparar')
  const prepared = await api(readyPath, winner, ready)
  assert.equal(prepared.estado, 'listo')
  assert.ok(Date.parse(prepared.vence) > Date.now() + 71 * 60 * 60 * 1000)
  const [deliverPath, deliver] = action(order.id, 'entregar', { codigoRetiro: order.codigoRetiro })
  const delivered = await api(deliverPath, winner, deliver)
  assert.equal(delivered.estado, 'entregado')
  assert.ok(delivered.venta.id)
  assert.equal(await available(), initial + 2)

  const [zone] = await api('/zonas?farmacia=1')
  const shipBody = { ...operation(centro, 1), modalidad: 'envio', zona: zone.id, direccion: 'Dirección de práctica 123' }
  const cancelled = await api('/pedidos', candidate, shipBody)
  assert.equal(cancelled.envioCentavos, zone.envioCentavos)
  const [cancelPath, cancel] = action(cancelled.id, 'cancelar')
  assert.equal((await api(cancelPath, candidate, cancel)).pago, 'revertido')
  assert.equal(await available(), initial + 2)

  const shipping = await api('/pedidos', candidate, { ...shipBody, operacionId: randomUUID() })
  for (const step of ['tomar', 'preparar', 'despachar', 'entregar']) {
    const [path, body] = action(shipping.id, step)
    const result = await api(path, cashier, body)
    if (step === 'entregar') assert.equal(result.estado, 'entregado')
  }
  assert.equal(await available(), initial + 1)
  const saleBody = operation(centro, 1)
  const sale = await api('/caja', cashier, saleBody)
  assert.equal((await api('/caja', cashier, saleBody)).id, sale.id)
  assert.equal(await available(), initial)
  await api('/historial?farmacia=2', supervisor, undefined, 403)
  const history = await api('/historial?farmacia=1', supervisor)
  assert.equal(history.ventas.find(v => v.id === sale.id).canal, 'presencial')
  assert.equal(history.ventas.find(v => v.id === delivered.venta.id).canal, 'online')
  assert.ok(history.ranking.some(row => row.farmacia === centro && row.ventas >= 3))

  const southCashier = await signIn('caja.sur@vitafarma.test')
  const southSale = await api('/caja', southCashier, operation(3, 1))
  const regional = await api('/historial', supervisor)
  assert.ok(regional.ventas.some(venta => venta.id === southSale.id && venta.farmacia === 3))
  assert.deepEqual(regional.ranking.map(row => row.farmacia).sort(), [centro, 3])
  await api('/stock', supervisor, { ...adjustment, operacionId: randomUUID(), farmacia: 3, cantidad: 1 })

  const shipment = (await api('/cola?farmacia=1&finalizados=1', boss)).find(order => order.id === shipping.id)
  assert.equal(shipment.estado, 'entregado')
  const [returnPath, returnBody] = action(shipping.id, 'devolver', { motivo: 'Recepción física comprobada en práctica' })
  await api(returnPath, cashier, returnBody, 403)
  const returned = await api(returnPath, boss, returnBody)
  assert.equal(returned.estado, 'devuelto')
  assert.equal(returned.pago, 'revertido')
  await api(returnPath, boss, returnBody)
  assert.equal(await available(), initial + 1)
  const afterReturn = await api('/historial?farmacia=1', supervisor)
  assert.equal(afterReturn.ventas.find(v => v.id === shipment.venta.id).revertida, true)
  assert.equal(afterReturn.ranking[0].ventas, history.ranking[0].ventas - 1)
  const reversed = await api('/historial?farmacia=1&estado=revertida', supervisor)
  assert.ok(reversed.ventas.some(v => v.id === shipment.venta.id))
  assert.ok(reversed.ventas.every(v => v.revertida && v.empleadoNombre))
  assert.deepEqual(reversed.ranking, afterReturn.ranking)
  await api('/stock', supervisor, { ...adjustment, operacionId: randomUUID(), cantidad: -1, motivo: 'Conciliación del saldo de práctica' })
})
