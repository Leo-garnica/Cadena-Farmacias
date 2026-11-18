import { replace, type LoaderFunctionArgs } from 'react-router'
import type { InventoryRepository } from '../application/inventory.repository'
import { parseQuery, positiveInteger, queryParams } from '../application/query'

export function createInventoryLoaders(inventoryRepository: InventoryRepository) {
  async function metadataLoader({ request }: LoaderFunctionArgs) {
    const metadata = await inventoryRepository.metadata(request.signal)
    if (!metadata.farmacias.length) throw new Response(null, { status: 403 })
    return metadata
  }

  async function inventoryLoader({ request, params }: LoaderFunctionArgs) {
    const url = new URL(request.url)
    const metadata = await inventoryRepository.metadata(request.signal)
    if (!metadata.farmacias.length) throw new Response(null, { status: 403 })
    const requested = positiveInteger(url.searchParams.get('farmacia'), 0)
    if (!params.idFarmacia && requested && !metadata.farmacias.some(branch => branch.id_farmacia === requested)) {
      throw new Response(null, { status: 403 })
    }
    const query = parseQuery(url.searchParams, metadata.farmacias.map((branch) => branch.id_farmacia), metadata.categorias.map((category) => category.id_categoria), params.idFarmacia)
    const result = await inventoryRepository.list(query, request.signal)
    const canonical = queryParams(result.query)
    if (url.searchParams.get('tab') === 'lote' && params.codigoProducto) canonical.set('tab', 'lote')
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
