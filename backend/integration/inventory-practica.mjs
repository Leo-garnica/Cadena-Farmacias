import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { arch, cpus, homedir, platform } from 'node:os'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import pg from 'pg'
import { createApplication } from '../dist/platform/http/create-application.js'

const home = join(homedir(), '.vitafarma', 'practica-v1')
const load = name => readFile(join(home, name), 'utf8')
const backend = parseEnv(await load('backend.env.local'))
const frontend = parseEnv(await load('frontend.env.local'))
const accounts = JSON.parse(await load('cuentas.json'))
const auth = 'http://127.0.0.1:55433'
const database = new URL(backend.DATABASE_URL)
assert.ok(database.hostname === '127.0.0.1' && database.port === '55432'
  && database.username === 'vf_lector' && database.pathname === '/vitafarma_practica')
assert.equal(backend.SUPABASE_URL, auth)
assert.equal(frontend.VITE_SUPABASE_URL, auth)
Object.assign(process.env, backend)
const app = await createApplication()
const pool = new pg.Pool({ connectionString: backend.DATABASE_URL, max: 1, connectionTimeoutMillis: 3000 })
const tokens = []
async function signIn(email) {
  const response = await fetch(auth + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: frontend.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: accounts[email] }), signal: AbortSignal.timeout(5000),
  })
  assert.equal(response.status, 200)
  const { access_token } = await response.json()
  assert.ok(typeof access_token === 'string')
  tokens.push(access_token)
  return access_token
}

try {
  await app.listen(0, '127.0.0.1')
  const base = (await app.getUrl()) + '/api/v1/'
  const operator = await signIn('operador@vitafarma.test')
  const supervisor = await signIn('supervisor@vitafarma.test')
  const unassigned = await signIn('sinacceso@vitafarma.test')
  async function request(path, status = 200, bearer = operator) {
    const response = await fetch(base + path, { headers: bearer ? { Authorization: 'Bearer ' + bearer } : {} })
    assert.equal(response.status, status, path)
    return response.json()
  }

  await request('ready')
  assert.deepEqual((await request('me')).sucursales, [1])
  await request('inventory/metadata', 403, unassigned)
  await request('inventory/metadata', 401, null)
  const meta = await request('inventory/metadata')
  assert.deepEqual(meta.farmacias.map(x => x.id_farmacia), [1])
  assert.deepEqual(meta.ciudades.map(x => x.id_ciudad), [1])
  assert.deepEqual((await request('inventory/metadata', 200, supervisor)).farmacias.map(x => x.id_farmacia), [1, 2])

  for (const [branch, account] of [[1, operator], [2, supervisor]]) {
    const where = '?farmacia=' + branch
    const list = await request('inventory' + where + '&orden=codigo-asc', 200, account)
    const last = await request('inventory' + where + '&orden=codigo-asc&pagina=99999', 200, account)
    assert.equal(list.total, 12)
    assert.equal(list.rows.length, 8)
    assert.equal(last.rows.length, 4)
    assert.equal(last.query.pagina, 2)
    assert.equal(new Set([...list.rows, ...last.rows].map(r => r.producto.codigo_producto)).size, list.total)
    const indicators = await request('reports/inventory' + where, 200, account)
    const { rows: [reference] } = await pool.query(`
      SELECT count(*)::int AS registros, count(*) FILTER (WHERE s.cantidad = 0)::int AS "sinUnidades",
        count(*) FILTER (WHERE l.fecha_vencimiento < (now() AT TIME ZONE 'America/La_Paz')::date)::int AS vencidos
      FROM public.stock s LEFT JOIN public.lote l ON l.id_lote = s.id_lote AND l.codigo_producto = s.codigo_producto
      WHERE s.id_farmacia = $1`, [branch])
    assert.deepEqual(indicators, { farmacia: branch, referenceDate: meta.referenceDate, ...reference })
    for (const [key, count] of Object.entries(reference)) assert.equal(list.summary[key], count)
    for (const [field, status] of [['registros', 'con-registro'], ['sinUnidades', 'sin-unidades'], ['vencidos', 'vencido']]) {
      const matching = await request('inventory' + where + '&estado=' + status, 200, account)
      assert.equal(matching.total, reference[field], status)
    }
    const onlyZero = await request('reports/inventory' + where + '&estado=sin-unidades', 200, account)
    assert.equal(onlyZero.registros, reference.sinUnidades)
    assert.equal(onlyZero.sinUnidades, reference.sinUnidades)
  }

  await request('inventory?farmacia=2', 403)
  await request('reports/inventory?farmacia=2', 403)
  assert.deepEqual(await request('inventory/2/101', 404), await request('inventory/1/999999', 404))
  assert.equal((await request('inventory/1/101')).stock.cantidad, 8)
  assert.equal((await request('inventory/2/101', 200, supervisor)).stock.cantidad, 24)
  assert.equal((await request('inventory/1/102')).stock.cantidad, 0)
  const unknown = await request('inventory/1/103')
  assert.equal(unknown.stock.cantidad, null)
  assert.equal(unknown.lote, null)
  assert.equal((await request('inventory/1/112')).stock, null)
  const medicine = await request('inventory/1/101')
  assert.ok(medicine.medicamento)
  assert.equal(typeof medicine.producto.precio_venta, 'number')
  assert.equal(Object.hasOwn(medicine.producto, 'precio_compra'), false)
  assert.match(medicine.lote.fecha_vencimiento, /^\d{4}-\d{2}-\d{2}$/u)
  assert.equal((await request('inventory?categoria=2&q=Esteriles')).total, 1)
  for (const needle of ['%', '_']) assert.equal((await request('inventory?q=' + encodeURIComponent(needle))).total, 0)
  assert.equal((await request('inventory?q=sin-coincidencias&pagina=123')).query.pagina, 1)
  await request('inventory?categoria=2147483647', 400)
  console.log('VF-PRACTICA-1: tres identidades verificadas; permisos efectivos, dos sucursales, páginas, detalle, filtros, nulos y tres métricas coinciden con PostgreSQL.')
  if (process.argv.includes('--rendimiento')) {
    console.log(`Equipo: ${platform()} ${arch()}, ${cpus()[0].model}, Node ${process.version}. 12 productos, sucursal 1, todos los estados.`)
    for (const route of ['inventory?farmacia=1', 'reports/inventory?farmacia=1']) {
      const measure = async () => {
        const start = performance.now()
        await request(route)
        return performance.now() - start
      }
      await Promise.all(Array.from({ length: 5 }, measure))
      const samples = []
      for (let i = 0; i < 10; i++) samples.push(...await Promise.all(Array.from({ length: 5 }, measure)))
      samples.sort((a, b) => a - b)
      console.log(`${route}: 50 muestras, concurrencia 5, p95 ${samples[Math.ceil(samples.length * 0.95) - 1].toFixed(1)} ms`)
    }
  }
} finally {
  try {
    for (const token of tokens) {
      await fetch(auth + '/auth/v1/logout?scope=local', { method: 'POST',
        headers: { apikey: frontend.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: 'Bearer ' + token },
        signal: AbortSignal.timeout(5000) })
    }
  } finally { await pool.end(); await app.close() }
}
