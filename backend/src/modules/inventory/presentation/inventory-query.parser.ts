import { BadRequestException, ForbiddenException } from '@nestjs/common'
import type { InventoryOrder, InventoryQuery, InventoryStatus } from '@vitafarma/contracts/inventory'
import type { InventoryQueries } from '../application/inventory.queries.js'

const orders: InventoryOrder[] = ['nombre-asc', 'nombre-desc', 'codigo-asc', 'cantidad-desc', 'vencimiento-asc']
const statuses: InventoryStatus[] = ['todos', 'con-registro', 'con-existencias', 'sin-unidades', 'sin-cantidad', 'sin-registro', 'sin-lote', 'vencido']
const keys = new Set(['farmacia', 'q', 'categoria', 'estado', 'orden', 'pagina'])

export function parsePositiveId(value: string): number {
  const id = Number(value)
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1 || id > 2147483647) throw new BadRequestException()
  return id
}
function option<T extends string>(value: string | undefined, allowed: T[], fallback: T): T {
  if (value === undefined) return fallback
  const selected = allowed.find(item => item === value)
  if (selected === undefined) throw new BadRequestException()
  return selected
}

export async function parseInventoryQuery(raw: Record<string, unknown>, branches: number[], inventory: InventoryQueries): Promise<InventoryQuery> {
  if (Object.entries(raw).some(([key, value]) => !keys.has(key) || typeof value !== 'string')) throw new BadRequestException()
  const query = raw as Record<string, string | undefined>
  const requested = query.farmacia === undefined ? undefined : parsePositiveId(query.farmacia)
  if (requested !== undefined && !branches.includes(requested)) throw new ForbiddenException()
  const categoria = query.categoria === undefined ? null : parsePositiveId(query.categoria)
  if ((query.q?.length ?? 0) > 100 || query.q?.includes('\0')) throw new BadRequestException()
  const estado = option(query.estado, statuses, 'todos')
  const orden = option(query.orden, orders, 'nombre-asc')
  const pagina = query.pagina === undefined ? 1 : parsePositiveId(query.pagina)
  const metadata = await inventory.metadata(branches)
  const farmacia = requested ?? metadata.farmacias[0]?.id_farmacia
  if (farmacia === undefined || !metadata.farmacias.some(branch => branch.id_farmacia === farmacia)) throw new ForbiddenException()
  if (categoria !== null && !metadata.categorias.some(category => category.id_categoria === categoria)) throw new BadRequestException()
  return { farmacia, categoria, q: (query.q ?? '').trim(), estado, orden, pagina }
}
