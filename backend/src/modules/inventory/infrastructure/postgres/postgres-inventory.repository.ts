import type { Categoria, Ciudad, DateOnly, Farmacia, InventoryMetadata, InventoryOrder, InventoryQuery, InventoryRow, InventoryStatus, InventorySummaryData } from '@vitafarma/contracts/inventory'
import type { PoolClient } from 'pg'
import { ReadDatabase } from '../../../../platform/database/read-database.js'
import type { InventoryReadRepository } from '../../application/inventory-read.repository.js'
import { normalizeSearch } from '../../domain/inventory.rules.js'

const referenceDate = "(CURRENT_TIMESTAMP AT TIME ZONE 'America/La_Paz')::date"
const name = "regexp_replace(normalize(lower(coalesce(p.nombre, '')), NFD), '[̀-ͯ]', '', 'g')"
// Product names can contain strengths and package sizes. Compare digit runs numerically.
const nameOrder = `CASE WHEN p.nombre IS NOT NULL THEN ARRAY(
  SELECT CASE WHEN part[1] ~ '^[0-9]' THEN lpad(part[1], 100, '0') ELSE part[1] END
  FROM regexp_matches(${name}, '[0-9]+|[^0-9]+', 'g') AS part
) END`
const expired = 'l.fecha_vencimiento < ' + referenceDate
const statusFilter: Record<InventoryStatus, string> = {
  todos: 'TRUE',
  'con-registro': 's.codigo_producto IS NOT NULL',
  'con-existencias': 's.cantidad > 0',
  'sin-unidades': 's.cantidad = 0',
  'sin-cantidad': 's.codigo_producto IS NOT NULL AND s.cantidad IS NULL',
  'sin-registro': 's.codigo_producto IS NULL',
  'sin-lote': 's.codigo_producto IS NOT NULL AND s.id_lote IS NULL',
  vencido: expired,
}
const order: Record<InventoryOrder, string> = {
  'nombre-asc': `${nameOrder} COLLATE "C" ASC NULLS LAST`,
  'nombre-desc': `${nameOrder} COLLATE "C" DESC NULLS FIRST`,
  'codigo-asc': 'p.codigo_producto ASC',
  'cantidad-desc': 's.cantidad DESC NULLS LAST',
  'vencimiento-asc': 'l.fecha_vencimiento ASC NULLS LAST',
}

const source = `
  FROM public.farmacia f CROSS JOIN public.producto p
  LEFT JOIN public.stock s ON s.id_farmacia = f.id_farmacia AND s.codigo_producto = p.codigo_producto
  LEFT JOIN public.categoria c ON c.id_categoria = p.id_categoria
  LEFT JOIN public.medicamento m ON m.codigo_producto = p.codigo_producto
  LEFT JOIN public.lote l ON l.id_lote = s.id_lote AND l.codigo_producto = p.codigo_producto
  WHERE f.id_farmacia = $1 AND f.id_farmacia = ANY($2::integer[])`

// Projections are allowlisted. Adding a database column never exposes it in the API.
function object(alias: string, columns: string) {
  return 'json_build_object(' + columns.split(' ').map(column => `'${column}', ${alias}.${column}`).join(', ') + ')'
}
const branchFields = 'id_farmacia id_ciudad nombre direccion telefono'
const categoryFields = 'id_categoria nombre descripcion'
const rowProjection = `
  ${object('f', branchFields)} AS farmacia,
  ${object('p', 'codigo_producto id_categoria nombre descripcion presentacion precio_venta')} AS producto,
  CASE WHEN c.id_categoria IS NOT NULL THEN ${object('c', categoryFields)} END AS categoria,
  CASE WHEN m.codigo_producto IS NOT NULL THEN ${object('m', 'codigo_producto id_laboratorio fecha_vencimiento accion_terapeutica')} END AS medicamento,
  CASE WHEN s.codigo_producto IS NOT NULL THEN ${object('s', 'id_farmacia codigo_producto id_lote cantidad')} END AS stock,
  CASE WHEN l.id_lote IS NOT NULL THEN ${object('l', 'id_lote codigo_producto codigo_alfanumerico fecha_fabricacion fecha_vencimiento')} END AS lote`

function filtered(query: InventoryQuery) {
  return `${source}
    AND ($3::integer IS NULL OR p.id_categoria = $3)
    AND ($4::text = '' OR strpos(${name}, $4) > 0 OR strpos(p.codigo_producto::text, $4) > 0)
    AND (${statusFilter[query.estado]})`
}

interface Totals { total: string; referenceDate: DateOnly; summary: InventorySummaryData }
async function totals(client: PoolClient, where: string, values: (string | number | null | number[])[]) {
  const result = await client.query<Totals>(`
    SELECT count(*) AS total, to_char(${referenceDate}, 'YYYY-MM-DD') AS "referenceDate",
      json_build_object(
        'registros', count(s.codigo_producto), 'conExistencias', count(*) FILTER (WHERE s.cantidad > 0),
        'sinUnidades', count(*) FILTER (WHERE s.cantidad = 0),
        'sinCantidad', count(*) FILTER (WHERE s.codigo_producto IS NOT NULL AND s.cantidad IS NULL),
        'sinRegistro', count(*) FILTER (WHERE s.codigo_producto IS NULL),
        'vencidos', count(*) FILTER (WHERE ${expired})
      ) AS summary ${where}`, values)
  return result.rows[0]
}
function parameters(branches: number[], query: InventoryQuery) {
  return [query.farmacia, branches, query.categoria, normalizeSearch(query.q)]
}

export class PostgresInventoryRepository implements InventoryReadRepository {
  constructor(private readonly database: ReadDatabase) {}

  metadata(branches: number[]): Promise<InventoryMetadata> {
    return this.database.read(async client => {
      const { rows: farmacias } = await client.query<Farmacia>(`SELECT ${branchFields.replaceAll(' ', ', ')} FROM public.farmacia
        WHERE id_farmacia = ANY($1::integer[]) ORDER BY id_farmacia`, [branches])
      const { rows: ciudades } = await client.query<Ciudad>(`SELECT id_ciudad, nombre FROM public.ciudad
        WHERE id_ciudad = ANY($1::integer[]) ORDER BY id_ciudad`, [farmacias.map(f => f.id_ciudad)])
      const categorias = farmacias.length ? (await client.query<Categoria>(
        `SELECT ${categoryFields.replaceAll(' ', ', ')} FROM public.categoria ORDER BY id_categoria`)).rows : []
      const day = await client.query<{ fecha: DateOnly }>(`SELECT to_char(${referenceDate}, 'YYYY-MM-DD') AS fecha`)
      return { farmacias, ciudades, categorias, referenceDate: day.rows[0].fecha }
    })
  }

  list(branches: number[], query: InventoryQuery) {
    return this.database.read(async client => {
      const where = filtered(query)
      const values = parameters(branches, query)
      const aggregate = await totals(client, where, values)
      const total = Number(aggregate.total)
      const pageSize = 8
      const pageCount = Math.max(1, Math.ceil(total / pageSize))
      const pagina = Math.min(query.pagina, pageCount)
      const result = await client.query<InventoryRow>(`SELECT ${rowProjection} ${where}
        ORDER BY ${order[query.orden]}, p.codigo_producto LIMIT $5 OFFSET $6`,
      [...values, pageSize, (pagina - 1) * pageSize])
      return { query: { ...query, pagina }, rows: result.rows, total, pageCount, pageSize, summary: aggregate.summary }
    })
  }

  detail(branches: number[], branch: number, product: number) {
    return this.database.read(async client => {
      const result = await client.query<InventoryRow>(`SELECT ${rowProjection} ${source} AND p.codigo_producto = $3`,
        [branch, branches, product])
      return result.rows[0] ?? null
    })
  }

  report(branches: number[], query: InventoryQuery) {
    return this.database.read(async client => {
      const { referenceDate, summary } = await totals(client, filtered(query), parameters(branches, query))
      const { registros, sinUnidades, vencidos } = summary
      return { farmacia: query.farmacia, referenceDate, registros, sinUnidades, vencidos }
    })
  }
}
