import { test } from 'node:test'
import assert from 'node:assert/strict'
import { InventoryQueries } from '../dist/modules/inventory/application/inventory.queries.js'
import { DemoInventoryRepository } from '../dist/modules/inventory/infrastructure/demo/demo-inventory.repository.js'
import { matchesStatus, normalizeSearch, summarize } from '../dist/modules/inventory/domain/inventory.rules.js'

test('historical fixture distinguishes zero, null, missing stock and missing lot', async () => {
  const fixture = new DemoInventoryRepository()
  const day = fixture.metadata().referenceDate
  const rows = await fixture.rows(1)
  for (const [status, ids] of [
    ['con-existencias', [4001]], ['sin-unidades', [4002]], ['sin-cantidad', [4003]],
    ['sin-registro', [4004]], ['sin-lote', [4003]], ['vencido', [4001]],
  ]) {
    assert.deepEqual(rows.filter(row => matchesStatus(row, status, day)).map(row => row.producto.codigo_producto), ids)
  }
  assert.deepEqual(summarize(rows, day), { registros: 3, conExistencias: 1, sinUnidades: 1, sinCantidad: 1, sinRegistro: 1, vencidos: 1 })
  assert.equal(normalizeSearch(' ÁCIDO '), 'acido')
})

test('detail outside the granted branches stays hidden without reaching the adapter', async () => {
  const queries = new InventoryQueries({ detail: () => assert.fail('unexpected query') })
  assert.equal(await queries.detail([1], 2, 101), null)
})
