import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { createApplication } from '../dist/platform/http/create-application.js'
import { localServerOptions } from '../dist/platform/config/local-server-options.js'

const sub = '00000000-0000-4000-8000-000000000001'
const other = '00000000-0000-4000-8000-000000000002'
let app, base, keys, issuer, signer, scopeToken
before(async () => {
  signer = await generateKeyPair('ES256')
  const publicKey = { ...await exportJWK(signer.publicKey), alg: 'ES256', kid: 'offline-unit', use: 'sig' }
  keys = createServer((request, res) => {
    if (request.url !== '/auth/v1/.well-known/jwks.json') { res.writeHead(404).end(); return }
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ keys: [publicKey] }))
  })
  await new Promise(resolve => keys.listen(0, '127.0.0.1', resolve))
  process.env.SUPABASE_URL = 'http://127.0.0.1:' + keys.address().port
  issuer = process.env.SUPABASE_URL + '/auth/v1'
  process.env.VITAFARMA_ACCESS_MAP = JSON.stringify({ [sub]: { perfil: 'consulta', sucursales: [1] } })
  delete process.env.DATABASE_URL
  app = await createApplication()
  await app.listen(0, '127.0.0.1')
  base = (await app.getUrl()) + '/api/v1'
  scopeToken = await token()
})
after(async () => {
  await app?.close()
  if (keys) await new Promise(resolve => keys.close(resolve))
})
function token(changes = {}, key = signer.privateKey) {
  return new SignJWT({ sub, role: 'authenticated', aud: 'authenticated', iss: issuer,
    exp: Math.floor(Date.now() / 1000) + 90, user_metadata: { perfil: 'responsable', sucursales: [2] }, ...changes })
    .setProtectedHeader({ alg: 'ES256', kid: 'offline-unit' }).sign(key)
}
function get(path, bearer) {
  return fetch(base + '/' + path, { headers: bearer ? { Authorization: 'Bearer ' + bearer } : {} })
}

test('liveness, database readiness and cache controls have separate meanings', async () => {
  const response = await get('health')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok', service: 'vitafarma-api', mode: 'postgresql' })
  const ready = await get('ready')
  assert.equal(ready.status, 503)
  assert.deepEqual(await ready.json(), { statusCode: 503, code: 'UNAVAILABLE', message: 'Consulta no disponible' })
  for (const route of ['health', 'ready', 'inventory', 'unknown']) {
    const r = await get(route)
    assert.equal(r.headers.get('cache-control'), 'no-store')
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(r.headers.get('x-powered-by'), null)
    assert.equal(r.headers.get('etag'), null)
    await r.arrayBuffer()
  }
})

test('internal API verifies token signature, issuer, audience, expiry and non-anonymous identity', async () => {
  for (const route of ['me', 'inventory/metadata', 'inventory', 'inventory/1/101', 'reports/inventory']) {
    assert.equal((await get(route)).status, 401)
  }
  const wrongKey = await generateKeyPair('ES256')
  for (const invalid of ['invalid', await token({ exp: 1 }), await token({ aud: 'different' }),
    await token({ iss: 'https://other.example.test/auth/v1' }), await token({ role: 'service_role' }),
    await token({ is_anonymous: true }), await token({}, wrongKey.privateKey)]) {
    assert.equal((await get('me', invalid)).status, 401)
  }
  assert.equal((await get('inventory', await token({ sub: other }))).status, 403)
})

test('scopes come only from the server, including direct requests to reports and details', async () => {
  const me = await get('me', scopeToken)
  assert.equal(me.status, 200)
  assert.deepEqual(await me.json(), { sub, perfil: 'consulta', sucursales: [1] })
  for (const route of ['inventory?farmacia=2', 'reports/inventory?farmacia=2']) {
    assert.equal((await get(route, scopeToken)).status, 403)
  }
  assert.equal((await get('inventory/2/101', scopeToken)).status, 404)
  for (const route of ['inventory/metadata', 'inventory?farmacia=1', 'inventory/1/101', 'reports/inventory?farmacia=1']) {
    assert.equal((await get(route, scopeToken)).status, 503)
  }
})

test('invalid queries and write operations do not reach data reads', async () => {
  for (const query of ['farmacia=0', 'farmacia=2147483648', 'pagina=-1', 'pagina=9007199254740992',
    'q=a&q=b', 'q=%00', 'unknown=1', 'orden=arbitrary', 'estado=arbitrary', 'q=' + 'x'.repeat(101)]) {
    assert.equal((await get('inventory?' + query, scopeToken)).status, 400, query)
  }
  assert.equal((await get('inventory/1/no-id', scopeToken)).status, 400)
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    assert.equal((await fetch(base + '/inventory', { method })).status, 404)
  }
})

test('server stays on loopback and validates its port', () => {
  assert.deepEqual(localServerOptions({}), { host: '127.0.0.1', port: 3000 })
  for (const PORT of ['0', '-1', '65536', 'not-a-number', '']) assert.throws(() => localServerOptions({ PORT }))
})
