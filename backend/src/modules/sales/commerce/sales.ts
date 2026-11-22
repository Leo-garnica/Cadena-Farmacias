import { ConflictException, NotFoundException } from '@nestjs/common'
import type { PoolClient } from 'pg'
import { lockInventory, lockOperation } from './stock.js'
import { amount, offset, pageSize, type Item, type Line } from './validation.js'

export type Channel = 'online' | 'presencial'

interface SaleData {
  farmacia: number
  cliente: number | null
  empleado: number
  sub: string
  lines: Line[]
  total: number
  pedido?: number
  operacion?: string
  solicitud?: string
}

const saleProjection = `v.id, v.farmacia, v.fecha, v.canal, v.total_centavos::text AS "totalCentavos",
  v.empleado_sub AS empleado, v.pedido, (v.revertida IS NOT NULL) AS revertida,
  (SELECT jsonb_agg(jsonb_build_object('codigo', i.codigo, 'nombre', i.nombre,
      'cantidad', i.cantidad, 'precioCentavos', i.precio_centavos) ORDER BY i.codigo)
    FROM commerce.venta_lineas i WHERE i.venta=v.id) AS items`

function saleResponse(row: Record<string, unknown>) {
  const { pedido, ...sale } = row
  return { ...sale, totalCentavos: Number(sale.totalCentavos), ...(pedido ? { pedido } : {}) }
}

export async function sale(db: PoolClient, id: number, customerView = false) {
  const { rows } = await db.query(`SELECT ${saleProjection} FROM commerce.ventas v WHERE v.id=$1`, [id])
  if (!rows.length) throw new NotFoundException()
  const result = saleResponse(rows[0])
  return customerView ? Object.fromEntries(Object.entries(result).filter(([key]) => key !== 'empleado')) : result
}

export async function registerSale(db: PoolClient, data: SaleData) {
  const { farmacia, cliente, empleado, sub, lines, total, pedido, operacion, solicitud } = data
  // The local copy mutates stock here. Refuse double debit if the academic stock triggers are ever installed.
  if ((await db.query(`SELECT FROM pg_trigger WHERE NOT tgisinternal AND tgenabled IN ('O','A')
    AND tgrelid IN ('public.venta'::regclass, 'public.detalle_venta'::regclass, 'public.stock'::regclass)
    LIMIT 1`)).rowCount) throw new ConflictException()
  const branch = await db.query('SELECT FROM public.empleado WHERE id_empleado=$1 AND id_farmacia=$2 FOR SHARE', [empleado, farmacia])
  if (!branch.rowCount) throw new NotFoundException()
  const { rows } = await db.query<{ id_venta: number }>(`
    INSERT INTO public.venta(id_venta,id_cliente,id_empleado,fecha_hora,total_cobrado)
    VALUES (nextval('practica_api.identificador'),$1,$2,(CURRENT_TIMESTAMP AT TIME ZONE 'America/La_Paz')::date,$3::numeric/100)
    RETURNING id_venta`, [cliente, empleado, total])
  const id = rows[0].id_venta
  await db.query(`INSERT INTO commerce.ventas (id,farmacia,empleado_sub,canal,total_centavos,pedido,operacion,solicitud)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [id, farmacia, sub, pedido ? 'online' : 'presencial', total,
    pedido ?? null, operacion ?? null, solicitud ?? null])
  for (const line of lines) {
    const { codigo, nombre, cantidad, precioCentavos } = line
    await db.query(`INSERT INTO public.detalle_venta(id_detalle,codigo_producto,id_venta,cantidad,precio_historico)
      VALUES(nextval('practica_api.identificador'),$1,$2,$3,$4::numeric/100)`, [codigo, id, cantidad, precioCentavos])
    await db.query(`INSERT INTO commerce.venta_lineas(venta,codigo,nombre,cantidad,precio_centavos,lote) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, codigo, nombre, cantidad, precioCentavos, line.lote ?? null])
    const updated = await db.query(`UPDATE public.stock SET cantidad=cantidad-$3
      WHERE id_farmacia=$1 AND codigo_producto=$2 AND cantidad >= $3`, [farmacia, codigo, cantidad])
    if (updated.rowCount !== 1) throw new ConflictException()
    await db.query(`INSERT INTO commerce.movimientos(farmacia,codigo,cantidad,motivo,actor,venta)
      VALUES ($1,$2,$3,$4,$5,$6)`, [farmacia, codigo, -cantidad,
      pedido ? 'Venta online de práctica' : 'Venta presencial de práctica', sub, id])
  }
  return id
}

export async function returnSale(db: PoolClient, id: number, branch: number, sub: string) {
  const eligible = await db.query(`UPDATE commerce.ventas SET revertida=clock_timestamp()
    WHERE id=$1 AND farmacia=$2 AND canal='online' AND revertida IS NULL`, [id, branch])
  if (eligible.rowCount !== 1) throw new ConflictException()
  const { rows } = await db.query<{ codigo: number; cantidad: number; lote: number | null }>(
    'SELECT codigo,cantidad,lote FROM commerce.venta_lineas WHERE venta=$1 ORDER BY codigo', [id],
  )
  for (const { codigo, cantidad, lote } of rows) {
    // The manager confirms physical receipt. Reintegrate only into the same, valid lot.
    const updated = await db.query(`UPDATE public.stock s SET cantidad=COALESCE(s.cantidad,0)+$3
      WHERE s.id_farmacia=$1 AND s.codigo_producto=$2 AND s.id_lote IS NOT DISTINCT FROM $4::integer
        AND COALESCE(s.cantidad,0) <= 2147483647-$3
        AND (s.id_lote IS NULL OR EXISTS (SELECT FROM public.lote l WHERE l.id_lote=s.id_lote
          AND l.codigo_producto=s.codigo_producto AND (l.fecha_vencimiento IS NULL OR
            l.fecha_vencimiento >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/La_Paz')::date)))`, [branch, codigo, cantidad, lote])
    if (updated.rowCount !== 1) throw new ConflictException()
    await db.query(`INSERT INTO commerce.movimientos(farmacia,codigo,cantidad,motivo,actor,venta)
      VALUES ($1,$2,$3,'Devolución confirmada de pedido',$4,$5)`, [branch, codigo, cantidad, sub, id])
  }
}

interface Checkout {
  operacion: string
  solicitud: string
  farmacia: number
  cliente: number | null
  empleado: number
  sub: string
  items: Item[]
  expected: number | null
}

export async function counterSale(db: PoolClient, data: Checkout) {
  const { operacion, solicitud, farmacia, cliente, empleado, sub, items, expected } = data
  await lockOperation(db, operacion)
  const { rows } = await db.query('SELECT id, empleado_sub, solicitud FROM commerce.ventas WHERE operacion=$1', [operacion])
  if (rows[0]) {
    if (rows[0].empleado_sub !== sub || rows[0].solicitud !== solicitud) throw new ConflictException()
    return sale(db, rows[0].id)
  }
  if (cliente !== null && !(await db.query(`SELECT 1 FROM commerce.cliente_sucursal WHERE cliente=$1 AND farmacia=$2
    UNION ALL SELECT 1 FROM commerce.pedidos WHERE cliente_id=$1 AND farmacia=$2 AND venta IS NOT NULL LIMIT 1`,
  [cliente, farmacia])).rowCount) {
    throw new NotFoundException()
  }
  const lines = await lockInventory(db, farmacia, items)
  const total = amount(lines)
  if (expected !== null && total !== expected) throw new ConflictException()
  return sale(db, await registerSale(db, { farmacia, cliente, empleado, sub, lines, total, operacion, solicitud }))
}

interface HistoryFilters {
  branches: number[]
  from: string | null
  to: string | null
  channel: Channel | null
  status: 'vigente' | 'revertida' | null
  first?: string
}

export async function history(db: PoolClient, filters: HistoryFilters) {
  const { branches, from, to, channel, status, first } = filters
  const params = [branches, from, to, channel]
  const slice = `v.farmacia=ANY($1::integer[]) AND ($2::date IS NULL OR v.fecha >= ($2::date::timestamp AT TIME ZONE 'America/La_Paz'))
    AND ($3::date IS NULL OR v.fecha < (($3::date + 1)::timestamp AT TIME ZONE 'America/La_Paz'))
    AND ($4::text IS NULL OR v.canal=$4)`
  const sales = (await db.query(`SELECT ${saleProjection}, e.nombre_completo AS "empleadoNombre"
    FROM commerce.ventas v JOIN public.venta a ON a.id_venta=v.id
    LEFT JOIN public.empleado e ON e.id_empleado=a.id_empleado
    WHERE ${slice} AND ($5::boolean IS NULL OR (v.revertida IS NOT NULL) = $5)
    ORDER BY v.fecha DESC, v.id DESC LIMIT $6 OFFSET $7`, [
    ...params, status === null ? null : status === 'revertida', pageSize, offset(first),
  ])).rows
  const ranking = (await db.query(`SELECT f.id_farmacia AS farmacia, f.nombre,
    COALESCE(sum(v.total_centavos),0)::text AS "totalCentavos", COUNT(v.id)::int AS ventas,
    COALESCE(sum(u.cantidad),0)::text AS unidades
    FROM public.farmacia f LEFT JOIN commerce.ventas v ON v.farmacia=f.id_farmacia AND v.revertida IS NULL AND ${slice}
    LEFT JOIN LATERAL (SELECT sum(cantidad) AS cantidad FROM commerce.venta_lineas WHERE venta=v.id) u ON true
    WHERE f.id_farmacia=ANY($1::integer[]) GROUP BY f.id_farmacia,f.nombre
    ORDER BY COALESCE(sum(v.total_centavos),0) DESC,f.id_farmacia`, params)).rows
  return {
    ventas: sales.map(saleResponse),
    ranking: ranking.map(row => ({ ...row, totalCentavos: Number(row.totalCentavos), unidades: Number(row.unidades) })),
  }
}
