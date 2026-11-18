import { httpInventoryRepository } from '../modules/inventory/public'
import { supabaseAuthRepository } from '../modules/access/public'

export const authRepository = supabaseAuthRepository

export const inventoryRepository = httpInventoryRepository
