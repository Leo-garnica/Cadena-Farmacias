import assert from 'node:assert/strict'
import { log } from 'node:console'
import { mkdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

const frontend = fileURLToPath(new URL('../', import.meta.url))
process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(frontend, '.browsers')
const { chromium, expect } = await import('@playwright/test')
const origin = 'http://127.0.0.1:5173'
const accounts = JSON.parse(await readFile(join(homedir(), '.vitafarma', 'practica-v1', 'cuentas.comercio.json'), 'utf8'))
const captures = join(frontend, 'test-results', 'comercio-local')
await mkdir(captures, { recursive: true })
const browser = await chromium.launch()

async function signIn(page, email) {
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(accounts[email])
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
}

try {
  const customer = await browser.newPage({ viewport: { width: 360, height: 840 }, reducedMotion: 'reduce' })
  customer.setDefaultTimeout(12_000)
  await customer.goto(origin)
  await expect(customer.getByRole('link', { name: 'Solicitar ingreso' })).toBeVisible()
  await expect(customer.getByRole('link', { name: /Iniciar sesión/ })).toHaveAttribute('href', /equipo\/entrar/)
  await customer.locator('body').evaluate(body => body.ownerDocument.fonts.ready)
  assert.ok(await customer.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth))
  await customer.screenshot({ path: join(captures, 'portada-360.png'), fullPage: true })

  await customer.getByRole('link', { name: 'Explorar la tienda' }).click()
  await expect(customer.getByRole('heading', { name: 'Compra en tu farmacia' })).toBeVisible({ timeout: 12_000 })
  await customer.getByRole('combobox', { name: /Sucursal/ }).selectOption('1')
  await customer.getByRole('button', { name: 'Agregar Cinta médica' }).click()
  await customer.getByRole('link', { name: 'Ingresar para comprar' }).click()
  await signIn(customer, 'cliente@vitafarma.test')
  const pay = customer.getByRole('button', { name: /Pagar · simulación/ })
  await expect(pay).toBeEnabled()
  assert.ok(await customer.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth))
  await customer.screenshot({ path: join(captures, 'carrito-360.png'), fullPage: true })
  await pay.click()
  await expect(customer).toHaveURL(/\/tienda\/pedidos\?pedido=\d+/)
  const id = new URL(customer.url()).searchParams.get('pedido')
  const order = customer.locator('#pedido-' + id)
  await expect(order.getByText('Pago simulado confirmado')).toBeVisible()

  const cashier = await browser.newPage({ viewport: { width: 1280, height: 920 }, reducedMotion: 'reduce' })
  cashier.setDefaultTimeout(12_000)
  await cashier.goto(origin + '/equipo/entrar?siguiente=/operaciones')
  await signIn(cashier, 'caja.centro@vitafarma.test')
  await expect(cashier).toHaveURL(/\/operaciones/)
  const queue = cashier.getByRole('button', { name: 'Pedidos', exact: true })
    .or(cashier.getByRole('link', { name: 'Pedidos', exact: true }))
  await queue.click()
  const queued = cashier.getByRole('article').filter({
    has: cashier.getByRole('heading', { name: 'Pedido #' + id, exact: true }),
  })
  await queued.getByRole('button', { name: 'Tomar pedido' }).click()
  await queued.getByRole('button', { name: 'Marcar como listo' }).click()
  const code = order.locator('.commerce-pickup-code strong')
  await expect(code).toHaveText(/^\d{6}$/, { timeout: 20_000 })
  await cashier.screenshot({ path: join(captures, 'pedidos-1280.png'), fullPage: true })
  await queued.getByRole('button', { name: 'Registrar retiro' }).click()
  await queued.getByLabel('Código de retiro').fill((await code.textContent()).trim())
  await queued.getByRole('button', { name: 'Confirmar retiro' }).click()
  await order.getByRole('button', { name: 'Ver comprobante' }).click({ timeout: 20_000 })
  await expect(customer.getByRole('dialog')).toBeVisible()
  await expect(customer.getByRole('button', { name: /Imprimir/ })).toBeVisible()
  await customer.screenshot({ path: join(captures, 'comprobante-360.png'), fullPage: true })

  log('Chromium verificó portada, carrito móvil, pago simulado, preparación, retiro con código y comprobante.')
} finally {
  await browser.close()
}
