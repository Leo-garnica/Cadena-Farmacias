import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ConflictException } from '@nestjs/common'
import { ownOrders, payOrder } from '../dist/modules/sales/commerce/orders.js'
import { lockInventory } from '../dist/modules/sales/commerce/stock.js'

test('ownOrders loads linked sales in one batched query without N+1 roundtrips', async () => {
  const queries = []
  const db = {
    async query(sql, params) {
      queries.push({ sql, params })
      if (sql.includes('WITH vencidos')) return { rows: [], rowCount: 0 }
      if (sql.includes('FROM commerce.pedidos p')) {
        return {
          rows: [
            {
              id: 1, farmacia: 1, modalidad: 'retiro', estado: 'entregado', fecha: '2026-11-22T10:00:00Z',
              vence: null, asignado: 'staff-1', totalCentavos: '1200', envioCentavos: 0,
              cliente_sub: 'cust-1', codigo_retiro: '123456', direccion: null, venta: 101,
              items: [{ codigo: 101, nombre: 'Paracetamol', cantidad: 2, precioCentavos: 600 }],
            },
            {
              id: 2, farmacia: 1, modalidad: 'retiro', estado: 'entregado', fecha: '2026-11-22T11:00:00Z',
              vence: null, asignado: 'staff-1', totalCentavos: '500', envioCentavos: 0,
              cliente_sub: 'cust-1', codigo_retiro: '654321', direccion: null, venta: 102,
              items: [{ codigo: 108, nombre: 'Cinta médica', cantidad: 1, precioCentavos: 500 }],
            },
          ],
        }
      }
      if (sql.includes('FROM commerce.ventas v WHERE v.id = ANY')) {
        assert.deepEqual(params, [[101, 102]])
        return {
          rows: [
            { id: 101, farmacia: 1, fecha: '2026-11-22T10:05:00Z', canal: 'online', totalCentavos: '1200', empleado: 'staff-1', pedido: 1, revertida: false, items: [] },
            { id: 102, farmacia: 1, fecha: '2026-11-22T11:05:00Z', canal: 'online', totalCentavos: '500', empleado: 'staff-1', pedido: 2, revertida: false, items: [] },
          ],
        }
      }
      assert.fail('Unexpected query: ' + sql)
    },
  }

  const orders = await ownOrders(db, 'cust-1')
  assert.equal(orders.length, 2)
  assert.equal(orders[0].venta.id, 101)
  assert.equal(orders[1].venta.id, 102)
  assert.equal('empleado' in orders[0].venta, false)
  assert.equal(queries.filter(q => q.sql.includes('FROM commerce.ventas')).length, 1)
})

test('lockInventory acquires all stock locks and reads post-lock reservations in two batched queries', async () => {
  const queries = []
  const db = {
    async query(sql, params) {
      queries.push({ sql, params })
      if (sql.includes('FOR UPDATE OF s FOR SHARE OF p')) {
        assert.deepEqual(params, [1, [101, 108]])
        return {
          rows: [
            { codigo: 101, cantidad: 5, lote: 1, nombre: 'Paracetamol', precio: '600', vendible: true },
            { codigo: 108, cantidad: 4, lote: null, nombre: 'Cinta médica', precio: '500', vendible: true },
          ],
        }
      }
      if (sql.includes('GROUP BY i.codigo')) {
        return { rows: [{ codigo: 101, cantidad: 2 }] }
      }
      assert.fail('Unexpected query: ' + sql)
    },
  }

  const lines = await lockInventory(db, 1, [{ codigo: 101, cantidad: 3 }, { codigo: 108, cantidad: 2 }])
  assert.equal(queries.length, 2)
  assert.deepEqual(lines, [
    { codigo: 101, cantidad: 3, nombre: 'Paracetamol', precioCentavos: 600, lote: 1 },
    { codigo: 108, cantidad: 2, nombre: 'Cinta médica', precioCentavos: 500, lote: null },
  ])

  await assert.rejects(
    () => lockInventory(db, 1, [{ codigo: 101, cantidad: 4 }, { codigo: 108, cantidad: 1 }]),
    ConflictException,
  )
})

test('payOrder inserts multiple order lines in a single unnest batch query', async () => {
  const queries = []
  const db = {
    async query(sql, params) {
      queries.push({ sql, params })
      if (sql.includes('pg_advisory_xact_lock')) return { rows: [] }
      if (sql.includes('SELECT id, cliente_sub, solicitud FROM commerce.pedidos')) return { rows: [] }
      if (sql.includes('FOR UPDATE OF s FOR SHARE OF p')) {
        return {
          rows: [
            { codigo: 101, cantidad: 10, lote: null, nombre: 'Paracetamol', precio: '600', vendible: true },
            { codigo: 104, cantidad: 10, lote: null, nombre: 'Venda elástica', precio: '500', vendible: true },
          ],
        }
      }
      if (sql.includes('GROUP BY i.codigo')) return { rows: [] }
      if (sql.includes('INSERT INTO commerce.pedidos')) return { rows: [{ id: 77 }] }
      if (sql.includes('INSERT INTO commerce.pedido_lineas')) return { rows: [] }
      if (sql.includes('INSERT INTO commerce.eventos')) return { rows: [] }
      if (sql.includes('FROM commerce.pedidos p WHERE p.id=$1')) {
        return {
          rows: [{
            id: 77, farmacia: 1, modalidad: 'retiro', estado: 'confirmado', fecha: '2026-11-22T12:00:00Z',
            vence: '2026-11-23T12:00:00Z', asignado: null, totalCentavos: '1700', envioCentavos: 0,
            cliente_sub: 'cust-1', codigo_retiro: '999888', direccion: null, venta: null,
            items: [
              { codigo: 101, nombre: 'Paracetamol', cantidad: 2, precioCentavos: 600 },
              { codigo: 104, nombre: 'Venda elástica', cantidad: 1, precioCentavos: 500 },
            ],
          }],
        }
      }
      assert.fail('Unexpected query: ' + sql)
    },
  }

  const order = await payOrder(db, 'cust-1', 1, {
    operacion: '00000000-0000-4000-8000-000000000099',
    solicitud: 'fp',
    farmacia: 1,
    modalidad: 'retiro',
    zona: null,
    direccion: null,
    items: [{ codigo: 101, cantidad: 2 }, { codigo: 104, cantidad: 1 }],
    expected: 1700,
  })
  assert.equal(order.id, 77)
  const lineInserts = queries.filter(q => q.sql.includes('INSERT INTO commerce.pedido_lineas'))
  assert.equal(lineInserts.length, 1)
  assert.deepEqual(lineInserts[0].params, [77, [101, 104], ['Paracetamol', 'Venda elástica'], [2, 1], [600, 500]])
})
