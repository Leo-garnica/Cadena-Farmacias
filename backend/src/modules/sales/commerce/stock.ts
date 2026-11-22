import { ConflictException, NotFoundException } from '@nestjs/common'
import type { PoolClient } from 'pg'
import { offset, pageSize, type Item, type Line } from './validation.js'

const activeStates = "('confirmado', 'en_preparacion', 'listo')"
const branchDate = "(CURRENT_TIMESTAMP AT TIME ZONE 'America/La_Paz')::date"
const price = `round(p.precio_venta * (100 - COALESCE((
  SELECT max(d.porcentaje) FROM public.descuento d WHERE d.codigo_producto=p.codigo_producto
    AND ${branchDate} BETWEEN d.fecha_inicio AND d.fecha_fin AND d.porcentaje BETWEEN 0 AND 100
),0)))::bigint`
const sellable = `(s.id_lote IS NULL OR (l.codigo_producto=p.codigo_producto AND (l.fecha_vencimiento IS NULL OR l.fecha_vencimiento >= ${branchDate})))`

export async function lockOperation(db: PoolClient, key: string) {
  await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 928))', [key])
}

export async function branches(db: PoolClient) {
  const { rows } = await db.query(`SELECT f.id_farmacia AS id, f.nombre, c.nombre AS ciudad, f.direccion
    FROM public.farmacia f LEFT JOIN public.ciudad c USING (id_ciudad)
    ORDER BY f.nombre NULLS LAST, f.id_farmacia`)
  return rows
}

export async function catalog(db: PoolClient, farmacia: number, query: string, first?: string) {
  if (!(await db.query('SELECT FROM public.farmacia WHERE id_farmacia=$1', [farmacia])).rowCount) throw new NotFoundException()
  const { rows } = await db.query(`
    SELECT p.codigo_producto AS codigo, COALESCE(p.nombre, 'Producto ' || p.codigo_producto) AS nombre,
      p.presentacion, ${price} AS "precioCentavos", CASE WHEN ${sellable}
        THEN greatest(0, COALESCE(s.cantidad, 0) - COALESCE(r.cantidad, 0)) ELSE 0 END AS disponible
    FROM public.producto p
    LEFT JOIN public.stock s ON s.codigo_producto=p.codigo_producto AND s.id_farmacia=$1
    LEFT JOIN public.lote l ON l.id_lote=s.id_lote
    LEFT JOIN LATERAL (
      SELECT sum(i.cantidad)::integer AS cantidad
      FROM commerce.pedido_lineas i JOIN commerce.pedidos b ON b.id=i.pedido
      WHERE b.farmacia=$1 AND i.codigo=p.codigo_producto AND b.estado IN ${activeStates} AND b.vence > clock_timestamp()
    ) r ON true
    WHERE p.precio_venta > 0 AND
      ($2='' OR position(lower($2) in lower(concat(p.nombre, ' ', p.codigo_producto, ' ', p.presentacion))) > 0)
    ORDER BY p.codigo_producto LIMIT $3 OFFSET $4`, [farmacia, query, pageSize, offset(first)])
  return rows.map(row => ({ ...row, precioCentavos: Number(row.precioCentavos) }))
}

export async function deliveryZones(db: PoolClient, farmacia: number) {
  return (await db.query(`SELECT id, nombre, envio_centavos AS "envioCentavos", plazo
    FROM commerce.zonas WHERE farmacia=$1 ORDER BY id`, [farmacia])).rows
}

export async function deliveryFee(db: PoolClient, farmacia: number, zone: number) {
  const { rows } = await db.query<{ envio_centavos: number }>(
    'SELECT envio_centavos FROM commerce.zonas WHERE farmacia=$1 AND id=$2', [farmacia, zone],
  )
  if (!rows.length) throw new ConflictException()
  return rows[0].envio_centavos
}

// All reservations, sales and adjustments lock the same physical rows before checking availability.
async function reserved(db: PoolClient, farmacia: number, codigo: number, exclude?: number) {
  const { rows } = await db.query<{ cantidad: number }>(`
    SELECT COALESCE(sum(i.cantidad), 0)::integer AS cantidad
    FROM commerce.pedidos p JOIN commerce.pedido_lineas i ON i.pedido=p.id
    WHERE p.farmacia=$1 AND i.codigo=$2 AND p.estado IN ${activeStates} AND p.vence > clock_timestamp()
      AND ($3::integer IS NULL OR p.id <> $3::integer)`, [farmacia, codigo, exclude ?? null])
  return rows[0].cantidad
}

export async function lockInventory(db: PoolClient, farmacia: number, items: Item[], exclude?: number): Promise<Line[]> {
  const codes = items.map(item => item.codigo)
  const { rows } = await db.query<{
    codigo: number; cantidad: number | null; lote: number | null; nombre: string; precio: string; vendible: boolean
  }>(`SELECT s.codigo_producto AS codigo, s.cantidad, s.id_lote AS lote,
    COALESCE(p.nombre, 'Producto ' || p.codigo_producto) AS nombre,
    ${price} AS precio, ${sellable} AS vendible
    FROM public.stock s JOIN public.producto p USING (codigo_producto)
    LEFT JOIN public.lote l ON l.id_lote=s.id_lote
    WHERE s.id_farmacia=$1 AND s.codigo_producto = ANY($2::integer[]) AND p.precio_venta > 0
    ORDER BY s.codigo_producto
    FOR UPDATE OF s FOR SHARE OF p`, [farmacia, codes])
  if (rows.length !== items.length) throw new ConflictException()
  // Read active reservations in a separate statement after all stock locks are acquired so READ COMMITTED sees newly committed holds.
  const reservedRows = (await db.query<{ codigo: number; cantidad: number }>(`
    SELECT i.codigo, COALESCE(sum(i.cantidad), 0)::integer AS cantidad
    FROM commerce.pedidos p JOIN commerce.pedido_lineas i ON i.pedido=p.id
    WHERE p.farmacia=$1 AND i.codigo = ANY($2::integer[]) AND p.estado IN ${activeStates} AND p.vence > clock_timestamp()
      AND ($3::integer IS NULL OR p.id <> $3::integer)
    GROUP BY i.codigo`, [farmacia, codes, exclude ?? null])).rows
  const reservedByCode = new Map(reservedRows.map(row => [row.codigo, row.cantidad]))
  const stockByCode = new Map(rows.map(row => [row.codigo, row]))
  return items.map(item => {
    const row = stockByCode.get(item.codigo)
    if (!row?.vendible || row.cantidad === null ||
        row.cantidad - (reservedByCode.get(item.codigo) ?? 0) < item.cantidad) throw new ConflictException()
    return { ...item, nombre: row.nombre, precioCentavos: Number(row.precio), lote: row.lote }
  })
}

export async function stockMovements(db: PoolClient, farmacia: number, first?: string) {
  return (await db.query(`SELECT id, farmacia, codigo, cantidad, motivo, fecha, actor FROM commerce.movimientos
    WHERE farmacia=$1 ORDER BY fecha DESC, id DESC LIMIT $2 OFFSET $3`, [farmacia, pageSize, offset(first)])).rows
}

interface Adjustment { operacion: string; farmacia: number; codigo: number; cantidad: number; motivo: string; solicitud: string }

export async function adjustStock(db: PoolClient, sub: string, data: Adjustment) {
  const { operacion, farmacia, codigo, cantidad, motivo, solicitud } = data
  await lockOperation(db, operacion)
  const previous = (await db.query(`SELECT id, farmacia, codigo, cantidad, motivo, fecha, actor, solicitud
    FROM commerce.movimientos WHERE operacion=$1`, [operacion])).rows[0]
  if (previous) {
    const { solicitud: original, ...movement } = previous
    if (movement.actor !== sub || original !== solicitud) throw new ConflictException()
    return movement
  }
  if (!(await db.query('SELECT FROM public.producto WHERE codigo_producto=$1 FOR SHARE', [codigo])).rowCount) {
    throw new NotFoundException()
  }
  // Insert a zero row for an unstocked product so concurrent first adjustments share a lock.
  await db.query(`INSERT INTO public.stock(id_farmacia,codigo_producto,cantidad) VALUES ($1,$2,0)
    ON CONFLICT (id_farmacia,codigo_producto) DO NOTHING`, [farmacia, codigo])
  const { rows } = await db.query(`SELECT cantidad FROM public.stock WHERE id_farmacia=$1 AND codigo_producto=$2
    FOR UPDATE`, [farmacia, codigo])
  const balance = (rows[0].cantidad ?? 0) + cantidad
  if (balance > 2_147_483_647 || balance < await reserved(db, farmacia, codigo)) throw new ConflictException()
  await db.query('UPDATE public.stock SET cantidad=$3 WHERE id_farmacia=$1 AND codigo_producto=$2',
    [farmacia, codigo, balance])
  return (await db.query(`INSERT INTO commerce.movimientos(farmacia,codigo,cantidad,motivo,actor,operacion,solicitud)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, farmacia, codigo, cantidad, motivo, fecha, actor`,
  [farmacia, codigo, cantidad, motivo, sub, operacion, solicitud])).rows[0]
}
