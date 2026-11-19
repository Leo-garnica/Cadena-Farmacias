import { expect, test } from './auth.mock'

test('cada indicador abre sus filas con la misma sucursal, búsqueda y categoría', async ({ page }) => {
  await page.goto('/indicadores?farmacia=1')
  const filters = page.getByRole('form', { name: 'Filtros de indicadores' })
  await filters.getByLabel('Producto').fill('10')
  await filters.getByLabel('Categoría').selectOption('1')
  await filters.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(page).toHaveURL(/categoria=1/)

  for (const indicator of [
    { label: 'Registros de stock', status: 'con-registro', rows: 4 },
    { label: 'Sin unidades', status: 'sin-unidades', rows: 1 },
    { label: 'Con lote vencido', status: 'vencido', rows: 1 },
  ]) {
    const link = page.getByRole('link', { name: `${indicator.label}: ${indicator.rows}. Ver registros`, exact: true })
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByLabel('Estado', { exact: true })).toHaveValue(indicator.status)
    await expect(page.getByLabel('Sucursal', { exact: true })).toHaveValue('1')
    await expect(page.getByLabel('Categoría', { exact: true })).toHaveValue('1')
    await expect(page.getByLabel('Buscar producto', { exact: true })).toHaveValue('10')
    await expect(page.locator('tbody tr')).toHaveCount(indicator.rows)
    await page.goBack()
    await expect(filters.getByLabel('Producto')).toHaveValue('10')
  }

  await page.getByLabel('Sucursal', { exact: true }).selectOption('2')
  await expect(page.getByRole('link', { name: 'Registros de stock: 0. Ver registros' })).toBeVisible()
  await expect(filters.getByLabel('Categoría')).toHaveValue('1')
})

test('denegación de la consulta de indicadores oculta los conteos de la sucursal anterior', async ({ page }) => {
  await page.goto('/indicadores?farmacia=1')
  await expect(page.getByRole('heading', { name: 'Indicadores de inventario' })).toBeVisible()
  await page.route('**/api/v1/reports/inventory?farmacia=2', route => route.fulfill({ status: 403 }))
  await page.getByLabel('Sucursal', { exact: true }).selectOption('2')
  await expect(page.getByRole('heading', { name: 'Acceso restringido' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver registros/ })).toHaveCount(0)
})
