import { createBrowserRouter, redirect } from 'react-router'
import { InitialLoading, NotFound } from './RouteStates'
import { InventoryPage, createInventoryLoaders } from '../modules/inventory/public'
import { authRepository, inventoryRepository } from './repositories'
import { LOGIN_PATH, protectLoader } from '../modules/access/public'
import { ProtectedShell, LoginRoute, ProtectedError } from './AccessRoutes'

const { detailLoader, inventoryLoader, metadataLoader } = createInventoryLoaders(inventoryRepository)

export const router = createBrowserRouter([
  { path: LOGIN_PATH, Component: LoginRoute },
  {
    id: 'app', path: '/', Component: ProtectedShell, loader: protectLoader(authRepository, metadataLoader),
    HydrateFallback: InitialLoading, ErrorBoundary: ProtectedError,
    children: [
      { index: true, loader: () => redirect('/inventario') },
      {
        id: 'inventory', path: 'inventario', Component: InventoryPage, loader: protectLoader(authRepository, inventoryLoader), ErrorBoundary: ProtectedError,
        children: [{ path: ':idFarmacia/:codigoProducto', loader: protectLoader(authRepository, detailLoader), lazy: async () => ({ Component: (await import('../modules/inventory/detail')).InventoryDetail }) }],
      },
      { path: '*', Component: NotFound },
    ],
  },
])
