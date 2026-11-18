import type { InventoryReadRepository } from './inventory-read.repository.js'
import type { InventoryQuery } from '@vitafarma/contracts/inventory'

export class InventoryQueries {
  constructor(private readonly repository: InventoryReadRepository) {}
  metadata(branches: number[]) { return this.repository.metadata(branches) }
  list(branches: number[], query: InventoryQuery) { return this.repository.list(branches, query) }
  report(branches: number[], query: InventoryQuery) { return this.repository.report(branches, query) }

  detail(branches: number[], branch: number, product: number) {
    return branches.includes(branch) ? this.repository.detail(branches, branch, product) : Promise.resolve(null)
  }
}
