import type { InventoryOrder, InventoryQuery, InventoryStatus } from '../domain/types'

export const orders: { value: InventoryOrder; label: string }[] = [
  { value: 'nombre-asc', label: 'Nombre: A a Z' }, { value: 'nombre-desc', label: 'Nombre: Z a A' },
  { value: 'codigo-asc', label: 'Código: menor a mayor' }, { value: 'cantidad-desc', label: 'Cantidad: mayor a menor' },
  { value: 'vencimiento-asc', label: 'Vencimiento: más cercano' },
]
export const statuses: { value: InventoryStatus; label: string }[] = [
  { value: 'todos', label: 'Todos los estados' }, { value: 'con-existencias', label: 'Con existencias' },
  { value: 'sin-unidades', label: 'Sin unidades (0)' }, { value: 'sin-cantidad', label: 'Cantidad no registrada' },
  { value: 'sin-registro', label: 'Sin registro de stock' }, { value: 'sin-lote', label: 'Sin lote asociado' },
  { value: 'vencido', label: 'Lote vencido' },
]
export function positiveInteger(value: string | null, fallback: number): number {
  return value !== null && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback
}
export function parseQuery(params: URLSearchParams, branchIds: number[], categoryIds: number[], detailBranch?: string): InventoryQuery {
  const branch = positiveInteger(detailBranch ?? params.get('farmacia'), branchIds[0])
  const category = positiveInteger(params.get('categoria'), 0)
  const orden = orders.find((item) => item.value === params.get('orden'))?.value ?? 'nombre-asc'
  const estado = statuses.find((item) => item.value === params.get('estado'))?.value ?? 'todos'
  return {
    farmacia: branchIds.includes(branch) ? branch : branchIds[0],
    q: (params.get('q') ?? '').trim().slice(0, 100),
    categoria: categoryIds.includes(category) ? category : null,
    orden, estado, pagina: positiveInteger(params.get('pagina'), 1),
  }
}
export function queryParams(query: InventoryQuery): URLSearchParams {
  const params = new URLSearchParams({ farmacia: String(query.farmacia), orden: query.orden, pagina: String(query.pagina) })
  if (query.q) params.set('q', query.q)
  if (query.categoria !== null) params.set('categoria', String(query.categoria))
  if (query.estado !== 'todos') params.set('estado', query.estado)
  return params
}
export function inventoryHref(query: InventoryQuery) { return `/inventario?${queryParams(query)}` }
