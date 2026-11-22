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
  await expect(customer.getByRole('link', { name: 'Mi cuenta' })).toHaveAttribute('href', '/tienda/entrar')
  const branches = customer.getByRole('combobox', { name: /Sucursal/ })
  await branches.selectOption('1')
  const tape = customer.getByRole('button', { name: 'Agregar Cinta médica' })
  const cart = customer.getByRole('button', { name: /^Carrito/ })
  const drawer = customer.getByRole('dialog', { name: 'Tu carrito' })
  await expect(tape).toBeEnabled()
  await expect(customer.getByText('Ver envase 3D')).toHaveCount(0)
  await expect(customer.locator('.vf-pack-scene')).toHaveCount(0)
  await customer.evaluate(async () => {
    await globalThis.document.fonts.ready
    const images = [...globalThis.document.querySelectorAll('.vf-product-media img')]
    for (const img of images) {
      img.loading = 'eager'
      await img.decode()
    }
  })
  const loadedProducts = await customer.evaluate(() => {
    const images = [...globalThis.document.querySelectorAll('.vf-product-media img')]
    return images.length > 0 && images.every(img => img.complete && img.naturalWidth > 0 && img.src.includes('/images/productos/'))
  })
  assert.ok(loadedProducts, 'Todas las fichas del catálogo deben mostrar imágenes de producto reales sin fondo.')
  for (const width of [1280, 768, 360]) {
    await customer.setViewportSize({ width, height: 840 })
    assert.ok(await customer.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth))
    await customer.screenshot({ path: join(captures, 'portada-' + width + '.png') })
  }
  await customer.getByRole('searchbox').fill('sin coincidencias de práctica')
  await customer.getByRole('button', { name: 'Buscar productos' }).click()
  await expect(customer.getByText('No encontramos productos para esa búsqueda.')).toBeVisible()
  await customer.getByRole('button', { name: 'Rollos' }).click()
  await expect(tape).toBeEnabled()
  await tape.click()
  await expect(cart).toHaveText(/Carrito\s*1/)
  await cart.click()
  await drawer.getByRole('button', { name: 'Eliminar Cinta médica del carrito' }).click()
  await expect(drawer.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible()
  await customer.keyboard.press('Escape')
  await expect(cart).toBeFocused()
  await tape.click()
  await branches.selectOption('2')
  await customer.getByRole('button', { name: 'Mantener sucursal' }).click()
  await expect(cart).toHaveText(/Carrito\s*1/)
  await branches.selectOption('2')
  await customer.getByRole('button', { name: 'Cambiar sucursal' }).click()
  await expect(cart).toHaveText(/Carrito\s*0/)
  await branches.selectOption('1')
  await tape.click()
  await cart.click()
  await customer.getByRole('link', { name: 'Ingresar para comprar' }).click()
  await signIn(customer, 'cliente@vitafarma.test')
  await expect(drawer.getByText('Cinta médica', { exact: true })).toBeVisible()
  const pay = customer.getByRole('button', { name: /Pagar · simulación/ })
  await expect(pay).toBeEnabled()
  const pickupTotal = await drawer.locator('.commerce-total strong').textContent()
  await drawer.getByLabel('Envío a domicilio').check()
  await expect(drawer.getByRole('option').nth(1)).toBeAttached()
  await drawer.getByLabel('Zona de entrega').selectOption({ index: 1 })
  await expect(drawer.locator('.commerce-total strong')).not.toHaveText(pickupTotal)
  await drawer.getByLabel('Retiro en sucursal').check()
  await expect(drawer.locator('.commerce-total strong')).toHaveText(pickupTotal)
  assert.ok(await customer.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth))
  await customer.screenshot({ path: join(captures, 'carrito-360.png') })
  await customer.setViewportSize({ width: 1280, height: 840 })
  await customer.screenshot({ path: join(captures, 'carrito-1280.png') })
  await customer.setViewportSize({ width: 360, height: 840 })
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
