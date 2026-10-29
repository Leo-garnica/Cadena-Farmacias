/** Public integration surface. The detail component remains a lazy import. */
export { InventoryPage } from './presentation/InventoryPage'
export { createInventoryLoaders } from './presentation/loaders'
export { inventoryHref, parseQuery } from './application/query'
export type { InventoryRepository } from './application/inventory.repository'
export type { InventoryMetadata } from './domain/types'
