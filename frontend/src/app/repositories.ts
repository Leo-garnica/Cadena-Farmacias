import { mockInventoryRepository } from '../modules/inventory/demo'
import type { InventoryRepository } from '../modules/inventory/public'
import { supabaseAuthRepository } from '../modules/access/public'

export const authRepository = supabaseAuthRepository

// Replace only after the access contract and authentication have been approved.
export const inventoryRepository: InventoryRepository = mockInventoryRepository
