import type { InventoryMetadata, InventoryQuery, InventoryReport, InventoryResult, InventoryRow } from '@vitafarma/contracts/inventory'

export interface InventoryReadRepository {
  metadata(branches: number[]): Promise<InventoryMetadata>
  list(branches: number[], query: InventoryQuery): Promise<InventoryResult>
  detail(branches: number[], branch: number, product: number): Promise<InventoryRow | null>
  report(branches: number[], query: InventoryQuery): Promise<InventoryReport>
}
