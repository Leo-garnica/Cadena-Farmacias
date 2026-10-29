import { BadRequestException } from '@nestjs/common'
import type { InventoryMetadata, InventoryOrder, InventoryQuery, InventoryStatus } from '@vitafarma/contracts/inventory'

const orders: InventoryOrder[] = ['nombre-asc', 'nombre-desc', 'codigo-asc', 'cantidad-desc', 'vencimiento-asc']
const statuses: InventoryStatus[] = ['todos', 'con-existencias', 'sin-unidades', 'sin-cantidad', 'sin-registro', 'sin-lote', 'vencido']
const keys = new Set(['farmacia', 'q', 'categoria', 'estado', 'orden', 'pagina'])

export function parsePositiveId(value: string): number {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw new BadRequestException()
  return Number(value)
}
function option<T extends string>(value: string | undefined, allowed: T[], fallback: T): T {
  if (value === undefined) return fallback
  const selected = allowed.find(item => item === value)
  if (selected === undefined) throw new BadRequestException()
  return selected
}
export function parseInventoryQuery(raw: Record<string, unknown>, metadata: InventoryMetadata): InventoryQuery {
  if (Object.entries(raw).some(([key, value]) => !keys.has(key) || typeof value !== 'string')) throw new BadRequestException()
  const query = raw as Record<string, string | undefined>
  const farmacia = query.farmacia === undefined ? metadata.farmacias[0]?.id_farmacia : parsePositiveId(query.farmacia)
  const categoria = query.categoria === undefined ? null : parsePositiveId(query.categoria)
  if (farmacia === undefined || !metadata.farmacias.some(branch => branch.id_farmacia === farmacia)) throw new BadRequestException()
  if (categoria !== null && !metadata.categorias.some(category => category.id_categoria === categoria)) throw new BadRequestException()
  if ((query.q?.length ?? 0) > 100) throw new BadRequestException()
  return {
    farmacia, categoria, q: (query.q ?? '').trim(),
    estado: option(query.estado, statuses, 'todos'), orden: option(query.orden, orders, 'nombre-asc'),
    pagina: query.pagina === undefined ? 1 : parsePositiveId(query.pagina),
  }
}
