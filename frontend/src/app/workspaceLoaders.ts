import { createInventoryLoaders } from '../modules/inventory/public'
import type { AccessGrant } from '@vitafarma/contracts/common'
import type { InventoryReport } from '@vitafarma/contracts/inventory'
import { apiRequest, protectLoader } from '../modules/access/public'
import { authRepository, inventoryRepository } from './repositories'

const { metadataLoader, inventoryLoader, detailLoader } = createInventoryLoaders(inventoryRepository)
export const loadMetadata = protectLoader(authRepository, async args => {
  const { signal } = args.request
  const [metadata, access] = await Promise.all([metadataLoader(args), apiRequest<AccessGrant>('/me', { signal })])
  let practice = false
  if (access.perfil === 'responsable') {
    try {
      await apiRequest('/practica/recursos', { signal })
      practice = true
    } catch (error) {
      signal.throwIfAborted()
      if (!(error instanceof Response) || ![403, 404, 503].includes(error.status)) throw error
    }
  }
  return { ...metadata, access, practice }
})
export const loadInventory = protectLoader(authRepository, inventoryLoader)
export const loadDetail = protectLoader(authRepository, detailLoader)
export const loadReport = protectLoader(authRepository, ({ request }) => {
  const filters = new URLSearchParams()
  const url = new URL(request.url)
  for (const key of ['farmacia', 'q', 'categoria']) {
    const value = url.searchParams.get(key)
    if (value) filters.set(key, value)
  }
  return apiRequest<InventoryReport>('/reports/inventory?' + filters, { signal: request.signal })
})
