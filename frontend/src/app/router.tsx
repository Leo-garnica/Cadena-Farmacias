import { createBrowserRouter } from 'react-router'
import { Brand } from './Brand'
import { InitialLoading, NotFound } from './RouteStates'
import { LOGIN_PATH } from '../shared/lib/paths'

const session = () => import('./SessionRoutes')
const workspace = () => import('./AccessRoutes')
const loaders = () => import('./workspaceLoaders')
const commerce = () => import('../modules/commerce/public')
const commerceEnabled = import.meta.env.VITE_VITAFARMA_COMERCIO === '1'

const loadLanding = async () => {
  const { LandingPage } = await import('../modules/landing/public')
  return {
    Component: function PublicLanding() {
      return <LandingPage brand={<Brand />} loginPath={LOGIN_PATH} />
    },
  }
}

export const router = createBrowserRouter([
  ...(!commerceEnabled ? [{ path: '/', lazy: loadLanding, HydrateFallback: InitialLoading }] : []),
  {
    lazy: async () => ({ Component: (await session()).SessionLayout }),
    HydrateFallback: InitialLoading,
    children: [
      { path: LOGIN_PATH, lazy: async () => ({ Component: (await session()).LoginRoute }) },
      ...(commerceEnabled ? [
        { path: '/', lazy: async () => (await commerce()).loadStorePage() },
        { path: '/tienda', lazy: async () => (await commerce()).loadStorePage() },
        { path: '/tienda/entrar', lazy: async () => (await commerce()).loadCustomerLoginPage() },
        { path: '/tienda/pedidos', lazy: async () => (await commerce()).loadCustomerOrdersPage() },
        { path: '/equipo/solicitar', lazy: async () => (await commerce()).loadStaffRequestPage() },
        { path: '/operaciones', lazy: async () => (await commerce()).loadOperationsPage() },
      ] : []),
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
