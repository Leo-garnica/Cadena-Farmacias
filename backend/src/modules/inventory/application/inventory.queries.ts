import type { InventoryQuery, InventoryResult } from '@vitafarma/contracts/inventory'
import type { InventoryReadRepository } from './inventory-read.repository.js'
import { compareRows, matchesStatus, normalizeSearch, summarize } from '../domain/inventory.rules.js'

/** Application service: framework-free; composition provides the read port. */
export class InventoryQueries {
  constructor(private readonly repository: InventoryReadRepository) {}

  metadata() { return this.repository.metadata() }

  async list(query: InventoryQuery): Promise<InventoryResult> {
    const { referenceDate } = this.metadata()
    const search = normalizeSearch(query.q)
    const rows = (await this.repository.rows(query.farmacia)).filter(row =>
      (query.categoria === null || row.producto.id_categoria === query.categoria)
      && (!search || normalizeSearch(row.producto.nombre ?? '').includes(search) || String(row.producto.codigo_producto).includes(search))
      && matchesStatus(row, query.estado, referenceDate),
    ).sort((a, b) => compareRows(a, b, query.orden))
    const pageSize = 8
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
    const pagina = Math.min(query.pagina, pageCount)
    return {
      query: { ...query, pagina }, rows: rows.slice((pagina - 1) * pageSize, pagina * pageSize),
      total: rows.length, pageCount, pageSize, summary: summarize(rows, referenceDate),
    }
  }

  detail(idFarmacia: number, codigoProducto: number) {
    return this.repository.detail(idFarmacia, codigoProducto)
  }
}
