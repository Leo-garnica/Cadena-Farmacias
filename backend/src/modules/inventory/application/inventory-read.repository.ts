import type { InventoryMetadata, InventoryRow } from '@vitafarma/contracts/inventory'

/** Read-only port. A future SQL adapter must preserve missing rows and nullable fields. */
export interface InventoryReadRepository {
  metadata(): InventoryMetadata
  rows(idFarmacia: number): Promise<InventoryRow[]>
  detail(idFarmacia: number, codigoProducto: number): Promise<InventoryRow | null>
}
