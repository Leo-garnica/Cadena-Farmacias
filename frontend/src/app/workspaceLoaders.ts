import { createInventoryLoaders } from '../modules/inventory/public'
import { protectLoader } from '../modules/access/public'
import { authRepository, inventoryRepository } from './repositories'

const { metadataLoader, inventoryLoader, detailLoader } = createInventoryLoaders(inventoryRepository)
export const loadMetadata = protectLoader(authRepository, metadataLoader)
export const loadInventory = protectLoader(authRepository, inventoryLoader)
export const loadDetail = protectLoader(authRepository, detailLoader)
