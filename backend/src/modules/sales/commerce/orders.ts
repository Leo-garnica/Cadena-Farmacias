import { randomInt } from 'node:crypto'
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import type { PoolClient } from 'pg'
import type { CommerceAccess } from '../../staff/public.js'
import { registerSale, returnSale, sale, salesByIds } from './sales.js'
import { deliveryFee, lockInventory, lockOperation } from './stock.js'
import { amount, offset, pageSize, type Item, type Line } from './validation.js'

type Mode = 'retiro' | 'envio'
type Status = 'confirmado' | 'en_preparacion' | 'listo' | 'en_camino' | 'entregado' | 'cancelado' | 'devuelto'
export type Action = 'tomar' | 'liberar' | 'preparar' | 'despachar' | 'entregar' | 'cancelar' | 'reasignar' | 'devolver'

const projection = `p.id, p.farmacia, p.modalidad, p.estado, p.fecha, p.vence, p.asignado,
  p.total_centavos AS "totalCentavos", p.envio_centavos AS "envioCentavos",
  p.cliente_sub, p.codigo_retiro, p.direccion, p.venta,
  (SELECT jsonb_agg(jsonb_build_object('codigo', i.codigo, 'nombre', i.nombre,
    'cantidad', i.cantidad, 'precioCentavos', i.precio_centavos) ORDER BY i.codigo)
    FROM commerce.pedido_lineas i WHERE i.pedido=p.id) AS items`

function formatOrder(sub: string, row: Record<string, unknown>, saleRecord?: Record<string, unknown>) {
  const { cliente_sub, direccion, codigo_retiro, venta, vence, asignado, ...data } = row
  const owner = sub === cliente_sub
  return {
    ...data, totalCentavos: Number(data.totalCentavos), pago: ['cancelado', 'devuelto'].includes(String(data.estado)) ? 'revertido' : 'simulado',
    ...(vence ? { vence } : {}), ...(!owner && asignado ? { asignado } : {}),
    ...(owner && codigo_retiro ? { codigoRetiro: codigo_retiro } : {}),
    ...((owner || sub === asignado) && direccion ? { direccion } : {}),
    ...(typeof venta === 'number' && saleRecord ? { venta: saleRecord } : {}),
  }
}

async function orderView(db: PoolClient, sub: string, row: Record<string, unknown>) {
  const saleId = typeof row.venta === 'number' ? row.venta : null
  const saleRecord = saleId === null ? undefined : await sale(db, saleId, sub === row.cliente_sub)
  return formatOrder(sub, row, saleRecord)
}

async function orderViews(db: PoolClient, sub: string, rows: Record<string, unknown>[], customerView: boolean) {
  const saleIds = rows.map(row => row.venta).filter((value): value is number => typeof value === 'number')
  const sales = await salesByIds(db, saleIds, customerView)
  return rows.map(row => formatOrder(sub, row, typeof row.venta === 'number' ? sales.get(row.venta) : undefined))
}

async function orderById(db: PoolClient, sub: string, orderId: number) {
  const { rows } = await db.query(`SELECT ${projection} FROM commerce.pedidos p WHERE p.id=$1`, [orderId])
  if (!rows.length) throw new NotFoundException()
  return orderView(db, sub, rows[0])
}

async function event(db: PoolClient, order: number, actor: string, action: Action | 'pagar', reason: string | null = null) {
  await db.query('INSERT INTO commerce.eventos(pedido, actor, accion, motivo) VALUES ($1,$2,$3,$4)',
    [order, actor, action, reason])
}

interface Checkout {
  operacion: string
  solicitud: string
  farmacia: number
  modalidad: Mode
  zona: number | null
  direccion: string | null
  items: Item[]
  expected: number | null
}

export async function payOrder(db: PoolClient, sub: string, client: number, data: Checkout) {
  const { operacion, solicitud, farmacia, modalidad, zona, direccion, items, expected } = data
  await lockOperation(db, operacion)
  const { rows } = await db.query('SELECT id, cliente_sub, solicitud FROM commerce.pedidos WHERE operacion=$1', [operacion])
  if (rows[0]) {
    if (rows[0].cliente_sub !== sub || rows[0].solicitud !== solicitud) throw new ConflictException()
    await expire(db, sub, null)
    return orderById(db, sub, rows[0].id)
  }
  const shipping = zona === null ? 0 : await deliveryFee(db, farmacia, zona)
  const lines = await lockInventory(db, farmacia, items)
  const total = amount(lines, shipping)
  if (expected !== null && total !== expected) throw new ConflictException()
  const code = modalidad === 'retiro' ? randomInt(100_000, 1_000_000).toString() : null
  const result = await db.query<{ id: number }>(`
    INSERT INTO commerce.pedidos(operacion,solicitud,cliente_sub,cliente_id,farmacia,modalidad,estado,vence,
      total_centavos,envio_centavos,zona,direccion,codigo_retiro)
    VALUES ($1,$2,$3,$4,$5,$6,'confirmado', clock_timestamp() + interval '24 hours',$7,$8,$9,$10,$11)
    RETURNING id`, [operacion, solicitud, sub, client, farmacia, modalidad, total, shipping, zona, direccion, code])
  const order = result.rows[0].id
  await db.query(`INSERT INTO commerce.pedido_lineas(pedido,codigo,nombre,cantidad,precio_centavos)
    SELECT $1, codigo, nombre, cantidad, precio
    FROM unnest($2::integer[], $3::text[], $4::integer[], $5::bigint[]) AS line(codigo, nombre, cantidad, precio)`, [
    order,
    lines.map(line => line.codigo),
    lines.map(line => line.nombre),
    lines.map(line => line.cantidad),
    lines.map(line => line.precioCentavos),
  ])
  await event(db, order, sub, 'pagar')
  return orderById(db, sub, order)
}

async function expire(db: PoolClient, customer: string | null, branch: number | null) {
  await db.query(`WITH vencidos AS (
    UPDATE commerce.pedidos SET estado='cancelado', vence=NULL
    WHERE ($1::uuid IS NULL OR cliente_sub=$1) AND ($2::int IS NULL OR farmacia=$2) AND vence <= clock_timestamp()
      AND estado IN ('confirmado','en_preparacion','listo') RETURNING id
  ) INSERT INTO commerce.eventos(pedido, accion, motivo)
    SELECT id,'caducar','Se agotó el plazo de preparación o retiro' FROM vencidos`, [customer, branch])
}

export async function ownOrders(db: PoolClient, sub: string, first?: string) {
  await expire(db, sub, null)
  const { rows } = await db.query(`SELECT ${projection} FROM commerce.pedidos p WHERE p.cliente_sub=$1
    ORDER BY p.fecha DESC, p.id DESC LIMIT $2 OFFSET $3`, [sub, pageSize, offset(first)])
  return orderViews(db, sub, rows, true)
}

export async function branchQueue(db: PoolClient, sub: string, branch: number, finalizados: boolean, first?: string) {
  await expire(db, null, branch)
  const estados = finalizados ? ['en_camino', 'entregado', 'devuelto'] : ['confirmado', 'en_preparacion', 'listo', 'en_camino']
  const { rows } = await db.query(`SELECT ${projection} FROM commerce.pedidos p
    WHERE p.farmacia=$1 AND p.estado = ANY($2::text[])
    ORDER BY CASE WHEN $3 THEN p.fecha END DESC, p.fecha, p.id
    LIMIT $4 OFFSET $5`, [branch, estados, finalizados, pageSize, offset(first)])
  return orderViews(db, sub, rows, false)
}

interface Change { accion: Action; codigoRetiro: string | null; motivo: string | null; empleadoSub: string | null }
interface LockedOrder {
  id: number
  cliente_sub: string
  cliente_id: number
  farmacia: number
  modalidad: Mode
  estado: Status
  asignado: string | null
  codigo_retiro: string | null
  vigente: boolean
  venta: number | null
  total_centavos: string
}

export async function changeOrder(db: PoolClient, access: CommerceAccess, sub: string, orderId: number, data: Change) {
  const { accion, codigoRetiro, motivo, empleadoSub } = data
  const { rows } = await db.query<LockedOrder>(`SELECT id, cliente_sub, cliente_id, farmacia, modalidad, estado,
    asignado, codigo_retiro, venta, total_centavos, (vence IS NULL OR vence > clock_timestamp()) AS vigente
    FROM commerce.pedidos WHERE id=$1 FOR UPDATE`, [orderId])
  const order = rows[0]
  if (!order) throw new NotFoundException()
  const owner = order.cliente_sub === sub
  const staffRoles = ['empleado', 'jefe', 'supervisor'] as const
  const member = owner ? null : await access.requireBranch(db, sub, order.farmacia, staffRoles).catch(error => {
    if (error instanceof ForbiddenException) throw new NotFoundException()
    throw error
  })
  const manager = member?.rol === 'supervisor' || member?.rol === 'jefe'
  const operator = member?.rol === 'empleado' || member?.rol === 'jefe'
  const assigned = order.asignado === sub && operator
  const state = order.estado
  let next: Status = state
  let assignee = order.asignado
  let expiresIn: string | null = null
  let clearExpiry = false
  let saleId = order.venta

  if (accion === 'cancelar' && ((owner || manager) || assigned) && state === 'cancelado') return orderById(db, sub, orderId)
  if (accion === 'devolver' && manager && state === 'devuelto') return orderById(db, sub, orderId)
  if (accion === 'entregar' && assigned && state === 'entregado') return orderById(db, sub, orderId)
  if (accion === 'despachar' && assigned && order.modalidad === 'envio' && state === 'en_camino') return orderById(db, sub, orderId)
  if (!order.vigente) throw new ConflictException()

  switch (accion) {
    case 'tomar':
      if (!operator) throw new ForbiddenException()
      if (state === 'en_preparacion' && assigned) return orderById(db, sub, orderId)
      if (state !== 'confirmado') throw new ConflictException()
      next = 'en_preparacion'
      assignee = sub
      break
    case 'liberar':
      if (!assigned && !manager) throw new ForbiddenException()
      if (state !== 'en_preparacion' || !motivo) throw new ConflictException()
      next = 'confirmado'
      assignee = null
      break
    case 'reasignar':
      if (!manager || !empleadoSub || !motivo) throw new ForbiddenException()
      if (!['en_preparacion', 'listo', 'en_camino'].includes(state)) throw new ConflictException()
      await access.requireBranch(db, empleadoSub, order.farmacia, ['empleado', 'jefe'])
      assignee = empleadoSub
      break
    case 'preparar':
      if (!assigned) throw new ForbiddenException()
      if (state === 'listo') return orderById(db, sub, orderId)
      if (state !== 'en_preparacion') throw new ConflictException()
      next = 'listo'
      expiresIn = order.modalidad === 'retiro' ? '72 hours' : '24 hours'
      break
    case 'cancelar':
      if (!owner && !manager && !assigned) throw new ForbiddenException()
      if (!['confirmado', 'en_preparacion', 'listo'].includes(state)) throw new ConflictException()
      next = 'cancelado'
      clearExpiry = true
      break
    case 'devolver':
      if (!manager || !motivo) throw new ForbiddenException()
      if (!saleId || !['en_camino', 'entregado'].includes(state)) throw new ConflictException()
      await returnSale(db, saleId, order.farmacia, sub)
      next = 'devuelto'
      break
    case 'despachar':
    case 'entregar': {
      if (!assigned || !member?.empleadoId) throw new ForbiddenException()
      const shipping = order.modalidad === 'envio'
      if (accion === 'entregar' && shipping) {
        if (state !== 'en_camino' || !saleId) throw new ConflictException()
      } else {
        if (state !== 'listo' || (accion === 'despachar' && !shipping)) throw new ConflictException()
        if (!shipping && codigoRetiro !== order.codigo_retiro) throw new ConflictException()
        const purchased = (await db.query<Omit<Line, 'precioCentavos'> & { precioCentavos: string }>(`
          SELECT codigo, nombre, cantidad, precio_centavos::text AS "precioCentavos"
          FROM commerce.pedido_lineas WHERE pedido=$1 ORDER BY codigo`, [orderId])).rows
        const stock = await lockInventory(db, order.farmacia, purchased, orderId)
        const lines = purchased.map((line, index) => ({
          ...line, precioCentavos: Number(line.precioCentavos), lote: stock[index].lote,
        }))
        saleId = await registerSale(db, { farmacia: order.farmacia, cliente: order.cliente_id,
          empleado: member.empleadoId, sub, lines, total: Number(order.total_centavos), pedido: orderId })
      }
      next = accion === 'despachar' ? 'en_camino' : 'entregado'
      clearExpiry = true
      break
    }
  }
  const updated = await db.query(`UPDATE commerce.pedidos SET estado=$2, asignado=$3, venta=$4,
    vence=CASE WHEN $5 THEN NULL WHEN $6::interval IS NOT NULL THEN clock_timestamp()+$6::interval ELSE vence END
    WHERE id=$1 AND (vence IS NULL OR vence > clock_timestamp())`, [orderId, next, assignee, saleId, clearExpiry, expiresIn])
  if (!updated.rowCount) throw new ConflictException()
  await event(db, orderId, sub, accion, motivo)
  return orderById(db, sub, orderId)
}
