import type { BrowserContext } from '@playwright/test'
import { parseQuery } from '../src/modules/inventory/application/query'
import { mockInventoryRepository as dataset } from '../src/modules/inventory/infrastructure/demo/inventory.mock'

/** Browser regression only. The application always communicates with NestJS. */
export async function mockInventoryApi(context: BrowserContext) {
  const metadata = await dataset.metadata()
  await context.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url())
    if (!route.request().headers().authorization?.startsWith('Bearer ')) return route.fulfill({ status: 401 })
    if (url.pathname.endsWith('/me')) return route.fulfill({ json: { sub: '11111111-1111-4111-8111-111111111111', perfil: 'consulta', sucursales: [1, 2, 3] } })
    if (url.pathname.endsWith('/inventory/metadata')) return route.fulfill({ json: metadata })
    const query = parseQuery(url.searchParams, metadata.farmacias.map(f => f.id_farmacia), metadata.categorias.map(c => c.id_categoria))
    if (url.pathname === '/api/v1/inventory') return route.fulfill({ json: await dataset.list(query) })
    if (url.pathname.endsWith('/reports/inventory')) {
      const { summary } = await dataset.list(query)
      return route.fulfill({ json: { farmacia: query.farmacia, referenceDate: metadata.referenceDate, registros: summary.registros, sinUnidades: summary.sinUnidades, vencidos: summary.vencidos } })
    }
    const detail = url.pathname.match(/\/inventory\/(\d+)\/(\d+)$/)
    if (detail) {
      const row = await dataset.detail(Number(detail[1]), Number(detail[2]))
      if (row) return route.fulfill({ json: row })
    }
    return route.fulfill({ status: 404 })
  })
}
