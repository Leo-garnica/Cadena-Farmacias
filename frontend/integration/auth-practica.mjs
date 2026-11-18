import assert from 'node:assert/strict'
import console from 'node:console'
import { mkdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { parseEnv } from 'node:util'
import { createServer } from 'vite'

const frontend = fileURLToPath(new URL('../', import.meta.url))
const practica = join(homedir(), '.vitafarma', 'practica-v1')
const origenWeb = 'http://127.0.0.1:4173'
const origenAuth = 'http://127.0.0.1:55433'
const correo = 'operador@vitafarma.test'
const capturas = join(frontend, 'test-results', 'practica')
await mkdir(capturas, { recursive: true })
const ready = await globalThis.fetch('http://127.0.0.1:3000/api/v1/ready', { signal: globalThis.AbortSignal.timeout(5000) })
assert.equal(ready.status, 200, 'Inicia la API con npm run dev:practica antes de ejecutar el recorrido.')

const publicas = parseEnv(await readFile(join(practica, 'frontend.env.local'), 'utf8'))
assert.equal(publicas.VITE_SUPABASE_URL, origenAuth)
assert.ok(publicas.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_'))
process.env.VITE_SUPABASE_URL = origenAuth
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = publicas.VITE_SUPABASE_PUBLISHABLE_KEY
process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(frontend, '.browsers')

const { chromium } = await import('@playwright/test')
const cuentas = JSON.parse(await readFile(join(practica, 'cuentas.json'), 'utf8'))
assert.ok(typeof cuentas[correo] === 'string' && cuentas[correo].length > 0)
const web = await createServer({
  root: frontend,
  envDir: false,
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
  logLevel: 'error',
})
let navegador
try {
  await web.listen()
  navegador = await chromium.launch()
  const contexto = await navegador.newContext({ serviceWorkers: 'block', locale: 'es-BO' })
  const externas = new Set()
  await contexto.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === origenWeb || url.origin === origenAuth) return route.continue()
    externas.add(url.origin)
    return route.abort()
  })
  const respuestaAuth = (ruta, metodo) => contexto.waitForEvent('response', {
    predicate: respuesta => {
      const url = new URL(respuesta.url())
      return url.origin === origenAuth && url.pathname === '/auth/v1/' + ruta && respuesta.request().method() === metodo
    },
    timeout: 15_000,
  })
  let pagina = await contexto.newPage()
  await pagina.goto(origenWeb + '/inventario')
  await pagina.waitForURL('**/equipo/entrar?**')
  await pagina.getByLabel('Correo electrónico').fill(correo)
  await pagina.getByLabel('Contraseña', { exact: true }).fill(cuentas[correo])
  const [token, identidad] = await Promise.all([
    respuestaAuth('token', 'POST'),
    respuestaAuth('user', 'GET'),
    pagina.getByRole('button', { name: 'Iniciar sesión', exact: true }).click(),
  ])
  assert.equal(token.status(), 200)
  assert.equal(identidad.status(), 200)
  const cerrar = { name: 'Cerrar sesión', exact: true }
  await pagina.getByRole('button', cerrar).waitFor()
  const sucursal = pagina.getByLabel('Sucursal', { exact: true })
  assert.equal(await sucursal.locator('option').count(), 1)
  assert.equal(await sucursal.inputValue(), '1')
  assert.equal(await pagina.getByTestId('summary-records').textContent(), '10')
  assert.equal(await pagina.getByTestId('summary-zero').textContent(), '2')
  await pagina.getByText('12 productos', { exact: true }).waitFor()
  await pagina.screenshot({ path: join(capturas, 'inventario-centro.png'), fullPage: true })
  await pagina.getByLabel('Buscar producto', { exact: true }).fill('Paracetamol')
  await pagina.getByRole('button', { name: 'Buscar', exact: true }).click()
  await pagina.getByRole('link', { name: 'Ver detalle de Paracetamol', exact: true }).click()
  await pagina.getByRole('dialog').waitFor()
  await pagina.getByRole('tab', { name: 'Lote asociado' }).click()
  await pagina.getByRole('tabpanel').getByText('PRACTICA-VENCIDO').waitFor()
  await pagina.screenshot({ path: join(capturas, 'inventario-lote.png') })
  await pagina.keyboard.press('Escape')
  await pagina.reload()
  await pagina.getByRole('button', cerrar).waitFor()
  await pagina.close()
  pagina = await contexto.newPage()
  await pagina.goto(origenWeb + '/inventario')
  const [salida] = await Promise.all([respuestaAuth('logout', 'POST'), pagina.getByRole('button', cerrar).click()])
  assert.equal(salida.status(), 204)
  await pagina.waitForURL('**/equipo/entrar?**')
  assert.equal(await pagina.evaluate(() => Object.keys(globalThis.localStorage).some(clave => clave.endsWith('-auth-token'))), false)
  await pagina.goto(origenWeb + '/inventario')
  await pagina.waitForURL('**/equipo/entrar?**')
  const siguienteCuenta = 'sinacceso@vitafarma.test'
  await pagina.getByLabel('Correo electrónico').fill(siguienteCuenta)
  await pagina.getByLabel('Contraseña', { exact: true }).fill(cuentas[siguienteCuenta])
  await pagina.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await pagina.getByRole('heading', { name: 'Acceso restringido' }).waitFor()
  assert.equal(await pagina.locator('tbody tr').count(), 0)
  await Promise.all([respuestaAuth('logout', 'POST'), pagina.getByRole('button', cerrar).click()])
  await pagina.waitForURL('**/equipo/entrar?**')
  assert.equal(externas.size, 0)
  console.log('Chromium comprobó login, alcance, 12 productos, saldos, lote, recarga, reapertura, cierre y ruta protegida.')
} finally {
  await navegador?.close()
  await web.close()
}
