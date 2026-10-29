import type { InventoryRepository } from '../../application/inventory.repository'
import type { InventoryQuery, InventoryRow, InventoryStatus } from '../../domain/types'
import { normalizeSearch } from '../../../../shared/lib/formatters'
import { categorias, ciudades, DEMO_REFERENCE_DATE, existencias, farmacias, lotes, medicamentos, productos } from './fixtures'

const stocksByKey = new Map(existencias.map((stock) => [`${stock.id_farmacia}:${stock.codigo_producto}`, stock]))
const lotsById = new Map(lotes.map((lote) => [lote.id_lote, lote]))
const categoriesById = new Map(categorias.map((categoria) => [categoria.id_categoria, categoria]))
const medicinesByCode = new Map(medicamentos.map((medicamento) => [medicamento.codigo_producto, medicamento]))
const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })
export const PAGE_SIZE = 8

export function isExpired(row: InventoryRow) {
  return row.lote?.fecha_vencimiento != null && row.lote.fecha_vencimiento < DEMO_REFERENCE_DATE
}
function matchesStatus(row: InventoryRow, status: InventoryStatus) {
  switch (status) {
    case 'con-existencias': return row.stock?.cantidad != null && row.stock.cantidad > 0
    case 'sin-unidades': return row.stock?.cantidad === 0
    case 'sin-cantidad': return row.stock !== null && row.stock.cantidad === null
    case 'sin-registro': return row.stock === null
    case 'sin-lote': return row.stock !== null && row.stock.id_lote === null
    case 'vencido': return isExpired(row)
    default: return true
  }
}
function branchRows(idFarmacia: number): InventoryRow[] {
  const farmacia = farmacias.find((branch) => branch.id_farmacia === idFarmacia)
  if (!farmacia) return []
  return productos.map((producto) => {
    const stock = stocksByKey.get(`${idFarmacia}:${producto.codigo_producto}`) ?? null
    return {
      producto, farmacia, stock,
      categoria: categoriesById.get(producto.id_categoria ?? -1) ?? null,
      lote: lotsById.get(stock?.id_lote ?? -1) ?? null,
      medicamento: medicinesByCode.get(producto.codigo_producto) ?? null,
    }
  })
}
function compareRows(a: InventoryRow, b: InventoryRow, order: InventoryQuery['orden']): number {
  let result: number
  switch (order) {
    case 'codigo-asc': result = a.producto.codigo_producto - b.producto.codigo_producto; break
    case 'cantidad-desc': result = (b.stock?.cantidad ?? -1) - (a.stock?.cantidad ?? -1); break
    case 'vencimiento-asc': result = collator.compare(a.lote?.fecha_vencimiento ?? '9999-12-31', b.lote?.fecha_vencimiento ?? '9999-12-31'); break
    default: result = collator.compare(a.producto.nombre ?? '\uffff', b.producto.nombre ?? '\uffff') * (order === 'nombre-desc' ? -1 : 1)
  }
  return result || a.producto.codigo_producto - b.producto.codigo_producto
}
export const mockInventoryRepository: InventoryRepository = {
  metadata: () => ({ farmacias, categorias, ciudades, referenceDate: DEMO_REFERENCE_DATE }),
  async list(query, signal) {
    signal?.throwIfAborted()
    const search = normalizeSearch(query.q)
    const filtered = branchRows(query.farmacia).filter((row) =>
      (query.categoria === null || row.producto.id_categoria === query.categoria)
      && (!search || normalizeSearch(row.producto.nombre ?? '').includes(search) || String(row.producto.codigo_producto).includes(search))
      && matchesStatus(row, query.estado),
    ).sort((a, b) => compareRows(a, b, query.orden))
    const summary = {
      registros: filtered.filter((row) => row.stock !== null).length,
      conExistencias: filtered.filter((row) => matchesStatus(row, 'con-existencias')).length,
      sinUnidades: filtered.filter((row) => matchesStatus(row, 'sin-unidades')).length,
      sinCantidad: filtered.filter((row) => matchesStatus(row, 'sin-cantidad')).length,
      sinRegistro: filtered.filter((row) => row.stock === null).length,
      vencidos: filtered.filter(isExpired).length,
    }
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const pagina = Math.min(query.pagina, pageCount)
    return { query: { ...query, pagina }, rows: filtered.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE), total: filtered.length, pageCount, pageSize: PAGE_SIZE, summary }
  },
  async detail(idFarmacia, codigoProducto, signal) {
    signal?.throwIfAborted()
    return branchRows(idFarmacia).find((row) => row.producto.codigo_producto === codigoProducto) ?? null
  },
}
