import { apiRequest } from '../../access/public'
import type { InventoryRepository } from '../application/inventory.repository'
import { queryParams } from '../application/query'
import type { InventoryMetadata, InventoryResult, InventoryRow } from '../domain/types'

export const httpInventoryRepository: InventoryRepository = {
  metadata: signal => apiRequest<InventoryMetadata>('/inventory/metadata', { signal }),
  list: (query, signal) => apiRequest<InventoryResult>('/inventory?' + queryParams(query), { signal }),
  async detail(branch, product, signal) {
    try {
      return await apiRequest<InventoryRow>(`/inventory/${branch}/${product}`, { signal })
    } catch (error) {
      if (error instanceof Response && error.status === 404) return null
      throw error
    }
  },
}
