import { test, expect } from '@playwright/test'

for (const width of [360, 768, 1280]) {
  test(`responsive ${width}px: consulta, detalle y captura`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/inventario?orden=codigo-asc')
    await expect(page.locator('tbody tr')).toHaveCount(8)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('body')).toHaveCSS('font-family', 'Inter, sans-serif')
    await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toHaveCSS('font-family', '"Inter Tight", Inter, sans-serif')
    expect(await page.evaluate(() => document.fonts.check('800 46px "Inter Tight"'))).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`inventario-${width}.png`), fullPage: true, animations: 'disabled' })
    if (width < 1024) {
      const menuButton = page.getByRole('button', { name: 'Abrir navegación' })
      await menuButton.click()
      await expect(page.getByRole('dialog')).toContainText('Próximamente')
      await page.keyboard.press('Escape')
      await expect(menuButton).toBeFocused()
    }
    await page.getByRole('link', { name: 'Ver detalle de Paracetamol 500 mg', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('tab', { name: 'Lote asociado' }).click()
    await expect(page.getByRole('tabpanel')).toContainText('Vencido')
    expect(await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.locator('.drawer__body').evaluate((element) => { element.scrollTop = 0 })
    await page.screenshot({ path: testInfo.outputPath(`detalle-${width}.png`), animations: 'disabled' })
    await page.locator('.drawer__body').evaluate((element) => { element.scrollTop = element.scrollHeight })
    const closeButton = page.getByRole('dialog').getByRole('button', { name: 'Cerrar panel' })
    await expect(closeButton).toBeVisible()
    const closeBounds = await closeButton.boundingBox()
    expect(closeBounds!.y).toBeGreaterThanOrEqual(0)
    expect(closeBounds!.y + closeBounds!.height).toBeLessThanOrEqual(900)
    await page.keyboard.press('Escape')
  })
}

test('reduced motion elimina transiciones y conserva la interacción', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/inventario')
  await page.getByRole('link', { name: /^Ver detalle de/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('.drawer-overlay')).toHaveCSS('animation-duration', '1e-05s')
  await expect(page.locator('.drawer')).toHaveCSS('transform', 'none')
  await page.getByRole('tab', { name: 'Lote asociado' }).click()
  await expect(page.getByRole('tab', { name: 'Lote asociado' })).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})

for (const timezoneId of ['America/La_Paz', 'Pacific/Kiritimati']) {
  test(`DATE no cambia de día en ${timezoneId}`, async ({ browser }) => {
    const context = await browser.newContext({ timezoneId })
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:5173/inventario/1/1004?tab=lote')
    const panel = page.getByRole('tabpanel')
    await expect(panel).toContainText('25/10/2026')
    await expect(panel).toContainText('Vence en fecha demo')
    await context.close()
  })
}

test('contraste de texto, controles y estados en los estilos renderizados', async ({ page }) => {
  await page.goto('/inventario?orden=codigo-asc')
  await expect(page.locator('tbody tr')).toHaveCount(8)
  const results = await page.evaluate(() => {
    const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
    const luminance = (color: number[]) => color.map((channel) => channel / 255).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
    return ['.product-name', '.product-presentation', '.product-code', '.demo-badge', '.status-badge--success', '.status-badge--warning', '.status-badge--danger', '.button--primary', '.sidebar-future', '.summary-footnote', '.detail-link'].map((selector) => {
      const element = document.querySelector(selector)!
      const foreground = rgb(getComputedStyle(element).color)
      let parent: Element | null = element
      let background = 'rgb(255, 255, 255)'
      while (parent) {
        const candidate = getComputedStyle(parent).backgroundColor
        if (candidate !== 'rgba(0, 0, 0, 0)' && candidate !== 'transparent') { background = candidate; break }
        parent = parent.parentElement
      }
      const values = [luminance(foreground), luminance(rgb(background))].sort((a, b) => b - a)
      return { selector, ratio: (values[0] + 0.05) / (values[1] + 0.05) }
    })
  })
  for (const result of results) expect(result.ratio, result.selector).toBeGreaterThanOrEqual(4.5)
})
