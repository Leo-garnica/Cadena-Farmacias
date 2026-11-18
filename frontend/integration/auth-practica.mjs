import assert from 'node:assert/strict'
import console from 'node:console'
import { readFile } from 'node:fs/promises'
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
  assert.equal(externas.size, 0)
  console.log('Acceso de práctica verificado en Chromium: inicio, identidad, recarga, reapertura, cierre y ruta protegida.')
} finally {
  await navegador?.close()
  await web.close()
}
