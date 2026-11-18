import { test, expect } from '@playwright/test'
import { appOrigin, authOrigin, authStorageState } from './auth.mock'

const heading = 'El inventario, desde el mostrador.'

for (const width of [360, 768, 1280]) {
  test(`mostrador público a ${width}px con teclado y movimiento reducido`, async ({ page }, info) => {
    const privateRequests: string[] = []
    page.on('request', request => {
      const url = new URL(request.url())
      if (url.origin !== appOrigin || url.pathname.startsWith('/api/')) privateRequests.push(url.pathname)
    })
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expect(page).toHaveTitle('VitaFarma · Mostrador')
    await page.evaluate(async () => {
      await document.fonts.ready
      await document.querySelector<HTMLImageElement>('.mostrador-photo img')!.decode()
    })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const enter = page.getByRole('link', { name: 'Acceso del personal' })
    await expect(enter).toHaveCSS('transition-duration', '0s')
    await page.screenshot({ path: info.outputPath(`mostrador-${width}.png`), fullPage: true })
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(enter).toBeFocused()
    await expect(enter).toHaveCSS('outline-style', 'solid')
    expect(privateRequests).toEqual([])
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/equipo\/entrar/)
    await expect(page.getByLabel('Correo electrónico')).toBeVisible()
  })
}

test.describe('credenciales guardadas en otro momento', () => {
  test.use({ storageState: authStorageState(true) })
  test('la portada sigue pública con Auth caído y una sesión vencida', async ({ context, page }) => {
    const requests: string[] = []
    await context.route(`${authOrigin}/**`, async route => {
      requests.push(new URL(route.request().url()).pathname)
      await route.abort()
    })
    await page.goto('/')
    await page.getByRole('link', { name: 'Qué puedes consultar' }).click()
    await expect(page.getByRole('heading', { name: 'Qué puedes consultar' })).toBeInViewport()
    expect(requests).toEqual([])
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  })
})
