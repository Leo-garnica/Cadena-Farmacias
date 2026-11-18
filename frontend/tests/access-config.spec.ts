import { test, expect } from '@playwright/test'

test('configuración ausente muestra ayuda y bloquea el envío sin solicitudes externas', async ({ page }) => {
  const external: string[] = []
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:5175')) external.push(request.url()) })
  await page.goto('/inventario')
  await expect(page).toHaveURL(/\/equipo\/entrar/)
  await expect(page.getByRole('alert')).toContainText('todavía no está configurado')
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeDisabled()
  expect(external).toEqual([])
})

test('la portada pública abre sin configuración de Auth', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'El inventario, desde el mostrador.' })).toBeVisible()
  await page.getByRole('link', { name: 'Acceso del personal' }).click()
  await expect(page).toHaveURL(/\/equipo\/entrar/)
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled()
})
