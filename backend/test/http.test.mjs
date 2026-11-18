import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { createApplication } from '../dist/platform/http/create-application.js'
import { HealthController } from '../dist/platform/http/health.controller.js'
import { localServerOptions } from '../dist/platform/config/local-server-options.js'

let app
let base
before(async () => {
  app = await createApplication()
  await app.listen(0, '127.0.0.1')
  base = `${await app.getUrl()}/api/v1`
})
after(async () => { await app?.close() })

test('health identifies the local demo and disconnected database', async () => {
  const response = await fetch(`${base}/health`)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-vitafarma-data'), 'synthetic-demo')
  assert.deepEqual(await response.json(), { status: 'ok', service: 'vitafarma-api', mode: 'demo', database: 'disconnected' })
})

test('readiness reports an unavailable database in demo mode', async () => {
  const response = await fetch(`${base}/ready`)
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { statusCode: 503, code: 'UNAVAILABLE', message: 'Consulta no disponible' })
})

test('readiness follows the current probe result and hides connection errors', async () => {
  let available = true
  const controller = new HealthController({
    async check() {
      if (!available) throw new Error('test-only connection details')
    },
  })
  assert.deepEqual(await controller.ready(), { status: 'ready' })
  available = false
  await assert.rejects(() => controller.ready(), error => error.getStatus() === 503 && !error.message.includes('test-only'))
})

test('success and error responses prohibit caching and content sniffing', async () => {
  for (const path of ['health', 'inventory/metadata', 'ready', 'unknown']) {
    const response = await fetch(`${base}/${path}`)
    assert.equal(response.headers.get('cache-control'), 'no-store', path)
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path)
    await response.arrayBuffer()
  }
})

test('metadata, list and detail expose the shared read contract', async () => {
  const metadata = await (await fetch(`${base}/inventory/metadata`)).json()
  assert.equal(metadata.referenceDate, '2026-10-25')
  const list = await fetch(`${base}/inventory?farmacia=1&estado=sin-cantidad`)
  assert.equal(list.status, 200)
  const result = await list.json()
  assert.equal(result.total, 1)
  assert.equal(result.rows[0].stock.cantidad, null)
  const detail = await fetch(`${base}/inventory/1/4004`)
  assert.equal(detail.status, 200)
  assert.equal((await detail.json()).stock, null)
})

test('invalid, repeated and unknown query parameters are rejected', async () => {
  for (const query of ['farmacia=0', 'farmacia=999', 'farmacia=9007199254740992', 'categoria=999', 'pagina=-1', 'orden=arbitrary', 'estado=arbitrary', 'q=a&q=b', 'unknown=1', `q=${'x'.repeat(101)}`]) {
    const response = await fetch(`${base}/inventory?${query}`)
    assert.equal(response.status, 400, query)
    assert.deepEqual(await response.json(), { statusCode: 400, code: 'BAD_REQUEST', message: 'Parámetros de consulta inválidos' })
  }
})

test('invalid identifiers and missing records return controlled errors', async () => {
  for (const [path, status] of [['inventory/1/no-id', 400], ['inventory/1/9999', 404], ['inventory/2/4001', 404], ['unknown', 404]]) {
    const response = await fetch(`${base}/${path}`)
    assert.equal(response.status, status, path)
    assert.deepEqual(Object.keys(await response.json()).sort(), ['code', 'message', 'statusCode'])
  }
})

test('business writes and future-module endpoints are unavailable', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    assert.equal((await fetch(`${base}/inventory`, { method })).status, 404)
  }
  assert.equal((await fetch(`${base}/sales`)).status, 404)
})

test('unexpected exceptions do not expose internal details', async () => {
  const { ApiExceptionFilter } = await import('../dist/platform/http/api-exception.filter.js')
  let result
  const host = { switchToHttp: () => ({ getResponse: () => ({ status: status => ({ json: body => { result = { status, body } } }) }) }) }
  new ApiExceptionFilter().catch(new Error('postgres://secret-connection'), host)
  assert.equal(result.status, 500)
  assert.equal(JSON.stringify(result).includes('secret-connection'), false)
  assert.equal(result.body.code, 'INTERNAL_ERROR')
})

test('server stays on loopback and validates an optional local port', () => {
  assert.deepEqual(localServerOptions({}), { host: '127.0.0.1', port: 3000 })
  assert.equal(localServerOptions({ PORT: '3001' }).port, 3001)
  for (const PORT of ['0', '-1', '65536', 'not-a-number', '']) assert.throws(() => localServerOptions({ PORT }))
})
