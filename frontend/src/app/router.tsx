import { createBrowserRouter } from 'react-router'
import { Brand } from './Brand'
import { InitialLoading, NotFound } from './RouteStates'
import { LandingPage } from '../modules/landing/public'
import { LOGIN_PATH } from '../shared/lib/paths'

const workspace = () => import('./AccessRoutes')
const loaders = () => import('./workspaceLoaders')

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage brand={<Brand />} loginPath={LOGIN_PATH} /> },
  {
    lazy: async () => ({ Component: (await workspace()).SessionLayout }),
    HydrateFallback: InitialLoading,
    children: [
      { path: LOGIN_PATH, lazy: async () => ({ Component: (await workspace()).LoginRoute }) },
      {
        id: 'app',
        lazy: async () => {
          const [routes, data] = await Promise.all([workspace(), loaders()])
          return { Component: routes.ProtectedShell, loader: data.loadMetadata, ErrorBoundary: routes.ProtectedError }
        },
        children: [
          {
            id: 'inventory', path: 'inventario',
            lazy: async () => {
              const [routes, data] = await Promise.all([workspace(), loaders()])
              return { Component: routes.InventoryPage, loader: data.loadInventory, ErrorBoundary: routes.ProtectedError }
            },
            children: [{
              path: ':idFarmacia/:codigoProducto',
              lazy: async () => {
                const [data, detail] = await Promise.all([loaders(), import('../modules/inventory/detail')])
                return { Component: detail.InventoryDetail, loader: data.loadDetail }
              },
            }],
          },
          { path: 'indicadores', lazy: async () => {
            const [page, data, routes] = await Promise.all([import('../modules/reports/public'), loaders(), workspace()])
            return { Component: page.ReportsPage, loader: data.loadReport, ErrorBoundary: routes.ProtectedError }
          } },
          { path: 'practica/ventas', lazy: async () => ({ Component: (await import('../modules/practice/public')).PracticeSalesPage }) },
          { path: 'practica/:recurso?', lazy: async () => ({ Component: (await import('../modules/practice/public')).PracticePage }) },
          { path: '*', Component: NotFound },
        ],
      },
    ],
  },
])
