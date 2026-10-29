import { test, expect } from '@playwright/test'
import { categorias, ciudades, DEMO_REFERENCE_DATE, existencias, farmacias, lotes, medicamentos, productos } from '../src/modules/inventory/infrastructure/demo/fixtures'
import { mockInventoryRepository } from '../src/modules/inventory/infrastructure/demo/inventory.mock'
import { formatDate } from '../src/shared/lib/formatters'
import { parseQuery, queryParams } from '../src/modules/inventory/application/query'
import { lotStatus } from '../src/modules/inventory/domain/status'
import type { InventoryQuery } from '../src/modules/inventory/domain/types'

const query: InventoryQuery = { farmacia: 1, q: '', categoria: null, estado: 'todos', orden: 'codigo-asc', pagina: 1 }

test('fixtures: 3 sucursales, 24 productos, 48 claves únicas y relaciones válidas', () => {
  expect(farmacias).toHaveLength(3)
  expect(productos).toHaveLength(24)
  expect(existencias).toHaveLength(48)
  expect(new Set(existencias.map((stock) => `${stock.id_farmacia}:${stock.codigo_producto}`)).size).toBe(48)
  expect(new Set(productos.map((product) => product.codigo_producto)).size).toBe(24)
  expect(new Set(lotes.map((lot) => lot.id_lote)).size).toBe(lotes.length)
  for (const branch of farmacias) {
    expect(ciudades.some((city) => city.id_ciudad === branch.id_ciudad)).toBe(true)
    expect(existencias.filter((stock) => stock.id_farmacia === branch.id_farmacia)).toHaveLength(16)
  }
  for (const product of productos) {
    expect(categorias.some((category) => category.id_categoria === product.id_categoria)).toBe(true)
    expect(product.nombre!.length).toBeLessThanOrEqual(100)
  }
  for (const medicine of medicamentos) expect(productos.some((product) => product.codigo_producto === medicine.codigo_producto)).toBe(true)
  for (const stock of existencias) {
    expect(farmacias.some((branch) => branch.id_farmacia === stock.id_farmacia)).toBe(true)
    expect(productos.some((product) => product.codigo_producto === stock.codigo_producto)).toBe(true)
    if (stock.id_lote !== null) expect(lotes.find((lot) => lot.id_lote === stock.id_lote)?.codigo_producto).toBe(stock.codigo_producto)
  }
})

test('resumen por registros: paginar no cambia métricas y los filtros sí', async () => {
  const first = await mockInventoryRepository.list(query)
  const second = await mockInventoryRepository.list({ ...query, pagina: 2 })
  expect(first.total).toBe(24)
  expect(first.summary).toEqual({ registros: 16, conExistencias: 11, sinUnidades: 3, sinCantidad: 2, sinRegistro: 8, vencidos: 2 })
  expect(second.summary).toEqual(first.summary)
  expect(second.rows.map((row) => row.producto.codigo_producto)).not.toEqual(first.rows.map((row) => row.producto.codigo_producto))
  const category = await mockInventoryRepository.list({ ...query, categoria: 1 })
  expect(category.total).toBe(4)
  expect(category.summary.registros).toBe(4)
  expect(category.summary.sinUnidades).toBe(1)
})

test('cero, NULL, ausencia de stock y ausencia de lote tienen filtros independientes', async () => {
  const zero = await mockInventoryRepository.list({ ...query, estado: 'sin-unidades' })
  const unknown = await mockInventoryRepository.list({ ...query, estado: 'sin-cantidad' })
  const absent = await mockInventoryRepository.list({ ...query, estado: 'sin-registro' })
  const noLot = await mockInventoryRepository.list({ ...query, estado: 'sin-lote' })
  expect(zero.total).toBe(3)
  expect(zero.rows.every((row) => row.stock?.cantidad === 0)).toBe(true)
  expect(unknown.total).toBe(2)
  expect(unknown.rows.every((row) => row.stock !== null && row.stock.cantidad === null)).toBe(true)
  expect(absent.total).toBe(8)
  expect(absent.rows.every((row) => row.stock === null)).toBe(true)
  expect(noLot.total).toBe(3)
  expect(noLot.rows.every((row) => row.stock !== null && row.lote === null)).toBe(true)
})

test('búsqueda sin tildes, orden estable, páginas válidas y cancelación', async () => {
  const found = await mockInventoryRepository.list({ ...query, q: 'ACIDO' })
  expect(found.rows[0].producto.codigo_producto).toBe(1004)
  const byCode = await mockInventoryRepository.list({ ...query, q: '1024' })
  expect(byCode.rows[0].producto.nombre).toBe('Termómetro digital')
  const byAmount = await mockInventoryRepository.list({ ...query, orden: 'cantidad-desc' })
  expect(byAmount.rows[0].stock?.cantidad).toBe(128)
  expect((await mockInventoryRepository.list({ ...query, pagina: 999 })).query.pagina).toBe(3)
  expect((await mockInventoryRepository.list({ ...query, q: 'inexistente', pagina: 999 })).query.pagina).toBe(1)
  const controller = new AbortController()
  controller.abort()
  await expect(mockInventoryRepository.list(query, controller.signal)).rejects.toThrow()
})

test('fechas DATE: día demo, vencido y sin fecha se distinguen', async () => {
  const past = await mockInventoryRepository.detail(1, 1001)
  const today = await mockInventoryRepository.detail(1, 1004)
  const undated = await mockInventoryRepository.detail(1, 1009)
  expect(formatDate(DEMO_REFERENCE_DATE)).toBe('25/10/2026')
  expect(lotStatus(past!, DEMO_REFERENCE_DATE).label).toBe('Vencido')
  expect(lotStatus(today!, DEMO_REFERENCE_DATE).label).toBe('Vence en fecha demo')
  expect(lotStatus(undated!, DEMO_REFERENCE_DATE).label).toBe('Fecha no registrada')
  expect(await mockInventoryRepository.detail(999, 1001)).toBeNull()
  expect(await mockInventoryRepository.detail(1, 9999)).toBeNull()
})

test('parámetros inválidos se normalizan y la clave compuesta determina la sucursal', () => {
  const parsed = parseQuery(new URLSearchParams('farmacia=999&pagina=-2&categoria=x&orden=drop&estado=x'), [1, 2, 3], [1, 2, 3, 4, 5, 6])
  expect(parsed).toEqual({ ...query, orden: 'nombre-asc' })
  const detail = parseQuery(new URLSearchParams('farmacia=1&pagina=2&q=termometro'), [1, 2, 3], [1, 2, 3, 4, 5, 6], '2')
  expect(detail.farmacia).toBe(2)
  expect(parseQuery(queryParams(detail), [1, 2, 3], [1, 2, 3, 4, 5, 6])).toEqual(detail)
})
