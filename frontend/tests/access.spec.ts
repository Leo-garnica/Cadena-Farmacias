import { test, expect, type Page } from '@playwright/test'
import { authStorageState, mockAuth, storageKey, testEmail, testPassword } from './auth.mock'

async function login(page: Page, password = testPassword) {
  await page.getByLabel('Correo electrónico').fill(testEmail)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
}

test('sin sesión, el enlace directo conserva destino sin mostrar inventario', async ({ page, context }) => {
  await mockAuth(context)
  await page.goto('/inventario/2/1009?tab=lote')
  await expect(page).toHaveURL(/\/equipo\/entrar\?siguiente=/)
  expect(new URL(page.url()).searchParams.get('siguiente')).toBe('/inventario/2/1009?tab=lote')
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toHaveCount(0)
  await login(page)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Lote asociado' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(testEmail, { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('credenciales incorrectas muestran error, no sesión, y permiten reintentar', async ({ page, context }) => {
  const auth = await mockAuth(context)
  await page.goto('/equipo/entrar')
  await login(page, 'incorrecta')
  await expect(page.getByRole('alert')).toContainText('Revisa tu correo y contraseña')
  await expect(page.getByRole('alert')).toBeFocused()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('')
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull()
  await login(page)
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toBeVisible()
  expect(auth.passwordRequests).toBe(2)
})

test('mostrar contraseña y envío pendiente impiden duplicar solicitudes', async ({ page, context }) => {
  const auth = await mockAuth(context)
  auth.tokenDelay = 500
  await page.goto('/equipo/entrar')
  const password = page.getByLabel('Contraseña', { exact: true })
  await password.fill(testPassword)
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ocultar contraseña' }).click()
  await expect(password).toHaveAttribute('type', 'password')
  await login(page)
  await expect(page.getByRole('button', { name: 'Ingresando…' })).toBeDisabled()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toBeVisible()
  expect(auth.passwordRequests).toBe(1)
})

test('fallo de conexión y límite de intentos no habilitan el área interna', async ({ page, context }) => {
  const auth = await mockAuth(context)
  auth.tokenStatus = 503
  await page.goto('/equipo/entrar')
  await login(page)
  await expect(page.getByRole('alert')).toContainText('No pudimos conectar')
  auth.tokenStatus = 429
  await login(page)
  await expect(page.getByRole('alert')).toContainText('demasiados intentos')
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toHaveCount(0)
})

test('logout limpia la sesión, sincroniza pestañas y bloquea Atrás y recarga', async ({ page, context }) => {
  await mockAuth(context)
  await page.goto('/equipo/entrar')
  await login(page)
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toBeVisible()
  const other = await context.newPage()
  await other.goto('/inventario')
  await expect(other.getByRole('heading', { name: 'Inventario', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/equipo\/entrar/)
  await expect(other).toHaveURL(/\/equipo\/entrar/)
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull()
  await page.goBack()
  await page.goto('/inventario')
  await expect(page).toHaveURL(/\/equipo\/entrar/)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toHaveCount(0)
})

test('el destino de regreso no permite redirecciones externas', async ({ page, context }) => {
  await mockAuth(context)
  await page.goto('/equipo/entrar?siguiente=https%3A%2F%2Fexample.com')
  await login(page)
  await expect(page).toHaveURL(/\/inventario\?/)
})

test('un fallo al revocar en servidor conserva el cierre local e informa su alcance', async ({ page, context }) => {
  const auth = await mockAuth(context)
  await page.goto('/equipo/entrar')
  await login(page)
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toBeVisible()
  auth.logoutStatus = 503
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/equipo\/entrar/)
  await expect(page.getByText('Cerraste sesión en este navegador.', { exact: false })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toHaveCount(0)
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull()
  await page.reload()
  await expect(page).toHaveURL(/\/equipo\/entrar/)
})

test('un fallo de Auth durante la navegación no genera un bucle de redirecciones', async ({ page, context }) => {
  const auth = await mockAuth(context)
  await page.goto('/equipo/entrar')
  await login(page)
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toBeVisible()
  auth.userStatus = 503
  await page.getByLabel('Sucursal', { exact: true }).selectOption('2')
  await expect(page).toHaveURL(/\/equipo\/entrar/)
  await expect(page.getByRole('alert')).toContainText('No pudimos conectar')
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeEnabled()
  await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toHaveCount(0)
})

test.describe('sesión guardada', () => {
  test.use({ storageState: authStorageState() })
  test('Auth rechaza un token guardado: se limpia y solicita iniciar sesión', async ({ page, context }) => {
    const auth = await mockAuth(context)
    auth.userStatus = 401
    await page.goto('/inventario')
    await expect(page).toHaveURL(/\/equipo\/entrar/)
    await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible()
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull()
    await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toHaveCount(0)
  })
  test('un fallo al verificar la sesión no reutiliza los datos de inventario', async ({ page, context }) => {
    const auth = await mockAuth(context)
    auth.userStatus = 503
    await page.goto('/inventario')
    await expect(page).toHaveURL(/\/equipo\/entrar/)
    await expect(page.getByRole('alert')).toContainText('No pudimos conectar')
    await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toHaveCount(0)
  })
})

test.describe('renovación', () => {
  test.use({ storageState: authStorageState(true) })
  test('renueva el token vencido antes de cargar la consulta', async ({ page, context }) => {
    const auth = await mockAuth(context)
    await page.goto('/inventario')
    await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toBeVisible()
    expect(auth.refreshRequests).toBeGreaterThan(0)
  })
  test('una renovación rechazada vuelve al login sin datos', async ({ page, context }) => {
    const auth = await mockAuth(context)
    auth.refreshStatus = 400
    await page.goto('/inventario')
    await expect(page).toHaveURL(/\/equipo\/entrar/)
    await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Inventario', exact: true })).toHaveCount(0)
  })
})

for (const width of [360, 768, 1280]) {
  test(`login responsive y teclado a ${width}px`, async ({ page, context }, testInfo) => {
    await mockAuth(context)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/equipo/entrar')
    await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible()
    await page.getByLabel('Correo electrónico').focus()
    await expect(page.getByLabel('Correo electrónico')).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Contraseña', { exact: true })).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: testInfo.outputPath(`login-${width}.png`), fullPage: true })
  })
}
