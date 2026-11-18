import type { InventoryMetadata, InventoryQuery, InventoryResult, InventoryRow } from '../domain/types'

export interface InventoryRepository {
  metadata(signal?: AbortSignal): Promise<InventoryMetadata>
  list(query: InventoryQuery, signal?: AbortSignal): Promise<InventoryResult>
  detail(idFarmacia: number, codigoProducto: number, signal?: AbortSignal): Promise<InventoryRow | null>
}
