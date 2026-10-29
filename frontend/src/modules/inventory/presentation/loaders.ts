import { replace, type LoaderFunctionArgs } from 'react-router'
import type { InventoryRepository } from '../application/inventory.repository'
import { parseQuery, positiveInteger, queryParams } from '../application/query'

async function demoScenario(url: URL, signal: AbortSignal) {
  if (url.searchParams.get('demo') === 'error') throw new Response('Consulta demo no disponible', { status: 503 })
  if (url.searchParams.get('demo') !== 'slow') return
  await new Promise<void>((resolve, reject) => {
    signal.throwIfAborted()
    const onAbort = () => { clearTimeout(timer); reject(signal.reason) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve() }, 1500)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}
export function createInventoryLoaders(inventoryRepository: InventoryRepository) {
  function metadataLoader() { return inventoryRepository.metadata() }

  async function inventoryLoader({ request, params }: LoaderFunctionArgs) {
    const url = new URL(request.url)
    await demoScenario(url, request.signal)
    const metadata = inventoryRepository.metadata()
    const query = parseQuery(url.searchParams, metadata.farmacias.map((branch) => branch.id_farmacia), metadata.categorias.map((category) => category.id_categoria), params.idFarmacia)
    const result = await inventoryRepository.list(query, request.signal)
    const canonical = queryParams(result.query)
    if (url.searchParams.get('tab') === 'lote' && params.codigoProducto) canonical.set('tab', 'lote')
    if (url.searchParams.get('demo') === 'slow') canonical.set('demo', 'slow')
    if (url.searchParams.toString() !== canonical.toString()) return replace(`${url.pathname}?${canonical}`)
    return result
  }

  async function detailLoader({ params, request }: LoaderFunctionArgs) {
    const idFarmacia = positiveInteger(params.idFarmacia ?? null, -1)
    const codigoProducto = positiveInteger(params.codigoProducto ?? null, -1)
    return inventoryRepository.detail(idFarmacia, codigoProducto, request.signal)
  }

  return { metadataLoader, inventoryLoader, detailLoader }
}
