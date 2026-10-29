import { test } from 'node:test'
import assert from 'node:assert/strict'
import { InventoryQueries } from '../dist/modules/inventory/application/inventory.queries.js'
import { DemoInventoryRepository } from '../dist/modules/inventory/infrastructure/demo/demo-inventory.repository.js'

const repository = new DemoInventoryRepository()
const inventory = new InventoryQueries(repository)
const query = { farmacia: 1, q: '', categoria: null, estado: 'todos', orden: 'codigo-asc', pagina: 1 }

test('zero, null quantity, missing stock and missing lot remain distinct', async () => {
  for (const [estado, codes] of [
    ['con-existencias', [4001]], ['sin-unidades', [4002]], ['sin-cantidad', [4003]],
    ['sin-registro', [4004]], ['sin-lote', [4003]], ['vencido', [4001]],
  ]) {
    const result = await inventory.list({ ...query, estado })
    assert.deepEqual(result.rows.map(row => row.producto.codigo_producto), codes, estado)
  }
  const result = await inventory.list(query)
  assert.deepEqual(result.summary, { registros: 3, conExistencias: 1, sinUnidades: 1, sinCantidad: 1, sinRegistro: 1, vencidos: 1 })
  assert.equal(result.rows[1].stock.cantidad, 0)
  assert.equal(result.rows[2].stock.cantidad, null)
  assert.equal(result.rows[2].lote, null)
  assert.equal(result.rows[3].stock, null)
})

test('summary covers the full filtered result before pagination', async () => {
  const original = await repository.rows(1)
  const many = Array.from({ length: 17 }, (_, index) => ({ ...original[0], producto: { ...original[0].producto, codigo_producto: index + 1 } }))
  const service = new InventoryQueries({ metadata: () => repository.metadata(), rows: async () => many, detail: async () => null })
  const result = await service.list({ ...query, pagina: 2 })
  assert.equal(result.rows.length, 8)
  assert.equal(result.rows[0].producto.codigo_producto, 9)
  assert.equal(result.total, 17)
  assert.equal(result.summary.conExistencias, 17)
  assert.equal(result.pageCount, 3)
  assert.equal((await service.list({ ...query, pagina: 999 })).query.pagina, 3)
  assert.equal((await service.list({ ...query, q: 'inexistente' })).pageCount, 1)
})

test('search ignores accents and detail requires both parts of the stock key', async () => {
  assert.equal((await inventory.list({ ...query, q: 'DÉMO 1' })).total, 1)
  assert.equal((await inventory.list({ ...query, q: '4002' })).rows[0].producto.codigo_producto, 4002)
  assert.equal(await inventory.detail(2, 4001), null)
  assert.equal((await inventory.detail(1, 4001)).lote.fecha_vencimiento, '2026-10-24')
})

test('demo responses cannot mutate the shared fixture state', async () => {
  const row = await inventory.detail(1, 4001)
  row.stock.cantidad = 999
  row.farmacia.nombre = 'Cambio externo'
  assert.equal((await inventory.detail(1, 4001)).stock.cantidad, 12)
  assert.equal(inventory.metadata().farmacias[0].nombre, 'Sucursal demo API')
})
