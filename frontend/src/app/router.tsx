import { createBrowserRouter, redirect } from 'react-router'
import { AppShell } from './AppShell'
import { InitialLoading, InventoryError, NotFound } from './RouteStates'
import { InventoryPage, createInventoryLoaders } from '../modules/inventory/public'
import { inventoryRepository } from './repositories'

const { detailLoader, inventoryLoader, metadataLoader } = createInventoryLoaders(inventoryRepository)

export const router = createBrowserRouter([
  {
    id: 'app', path: '/', Component: AppShell, loader: metadataLoader,
    HydrateFallback: InitialLoading, ErrorBoundary: InventoryError,
    children: [
      { index: true, loader: () => redirect('/inventario') },
      {
        id: 'inventory', path: 'inventario', Component: InventoryPage, loader: inventoryLoader, ErrorBoundary: InventoryError,
        children: [{ path: ':idFarmacia/:codigoProducto', loader: detailLoader, lazy: async () => ({ Component: (await import('../modules/inventory/detail')).InventoryDetail }) }],
      },
      { path: '*', Component: NotFound },
    ],
  },
])
