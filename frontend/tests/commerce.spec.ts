import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { mockAuth, storageKey, testEmail, testPassword, testSession } from './auth.mock'

const commerceOrigin = 'http://127.0.0.1:5176'

const branches = [
  { id: 1, nombre: 'Sucursal Centro', ciudad: 'Cochabamba', direccion: 'Dirección de práctica A' },
  { id: 2, nombre: 'Sucursal Norte', ciudad: 'Sucre', direccion: 'Dirección de práctica B' },
  { id: 3, nombre: 'Sucursal Sur', ciudad: 'Cochabamba', direccion: 'Dirección de práctica Sur' },
]

const catalogByBranch: Record<number, Array<{ codigo: number; nombre: string; presentacion: string; precioCentavos: number; disponible: number }>> = {
  1: [
    { codigo: 101, nombre: 'Paracetamol', presentacion: 'Caja', precioCentavos: 600, disponible: 8 },
    { codigo: 102, nombre: 'Gasas estériles', presentacion: 'Paquete', precioCentavos: 700, disponible: 0 },
    { codigo: 103, nombre: 'Jabón neutro', presentacion: 'Barra', precioCentavos: 800, disponible: 3 },
    { codigo: 104, nombre: 'Venda elástica', presentacion: 'Rollo', precioCentavos: 500, disponible: 7 },
    { codigo: 105, nombre: 'Algodón', presentacion: 'Bolsa', precioCentavos: 600, disponible: 2 },
    { codigo: 106, nombre: 'Guantes', presentacion: 'Caja', precioCentavos: 700, disponible: 4 },
    { codigo: 107, nombre: 'Termómetro', presentacion: 'Unidad', precioCentavos: 800, disponible: 1 },
    { codigo: 108, nombre: 'Cinta médica', presentacion: 'Rollo', precioCentavos: 500, disponible: 9 },
    { codigo: 109, nombre: 'Crema de manos', presentacion: 'Tubo', precioCentavos: 600, disponible: 5 },
    { codigo: 110, nombre: 'Mascarillas', presentacion: 'Caja', precioCentavos: 700, disponible: 5 },
    { codigo: 111, nombre: 'Protector solar', presentacion: 'Frasco', precioCentavos: 800, disponible: 6 },
    { codigo: 112, nombre: 'Apósitos', presentacion: 'Caja', precioCentavos: 500, disponible: 4 },
  ],
  2: [
    { codigo: 101, nombre: 'Paracetamol', presentacion: 'Caja', precioCentavos: 600, disponible: 24 },
    { codigo: 104, nombre: 'Venda elástica', presentacion: 'Rollo', precioCentavos: 500, disponible: 10 },
    { codigo: 999, nombre: 'Ibuprofeno 400 mg', presentacion: 'Caja', precioCentavos: 1800, disponible: 6 },
  ],
  3: [
    { codigo: 104, nombre: 'Venda elástica', presentacion: 'Rollo', precioCentavos: 500, disponible: 8 },
  ],
}

const zonesByBranch: Record<number, Array<{ id: number; nombre: string; envioCentavos: number; plazo: string }>> = {
  1: [{ id: 10, nombre: 'Zona urbana de Cochabamba', envioCentavos: 800, plazo: '45–90 min · simulación' }],
  2: [{ id: 20, nombre: 'Zona urbana de Sucre', envioCentavos: 800, plazo: '45–90 min · simulación' }],
  3: [{ id: 30, nombre: 'Zona urbana de Cochabamba', envioCentavos: 800, plazo: '45–90 min · simulación' }],
}

interface OrderRecord {
  id: number
  farmacia: number
  modalidad: 'retiro' | 'envio'
  estado: 'confirmado' | 'en_preparacion' | 'listo' | 'en_camino' | 'entregado' | 'cancelado' | 'devuelto'
  fecha: string
  vence?: string
  totalCentavos: number
  envioCentavos: number
  asignado?: string
  codigoRetiro?: string
  direccion?: string
  pago: 'simulado' | 'revertido'
  items: Array<{ codigo: number; nombre: string; cantidad: number; precioCentavos: number }>
  venta?: {
    id: number; farmacia: number; fecha: string; canal: 'online' | 'presencial'
    totalCentavos: number; empleadoNombre?: string; items: Array<{ codigo: number; nombre: string; cantidad: number; precioCentavos: number }>
  }
}

async function mockCommerceApi(context: BrowserContext, options: {
  identity?: { tipo: 'cliente' | 'personal' | 'sin_registro'; nombre: string | null; sucursales: Array<{ id: number; nombre: string; departamento: string; rol: 'supervisor' | 'jefe' | 'empleado' }> }
  failFirstOrder?: boolean
} = {}) {
  await mockAuth(context)
  const identity = options.identity ?? { tipo: 'cliente' as const, nombre: 'Cliente E2E', sucursales: [] }
  const operationIds: string[] = []
  let failOrderOnce = options.failFirstOrder ?? false
  const orders: OrderRecord[] = []
  const sales: Array<{
    id: number; farmacia: number; fecha: string; canal: 'online' | 'presencial'
    totalCentavos: number; empleadoNombre: string; revertida?: boolean
    items: Array<{ codigo: number; nombre: string; cantidad: number; precioCentavos: number }>
  }> = [
    {
      id: 700, farmacia: 1, fecha: '2026-11-20T14:00:00Z', canal: 'presencial', totalCentavos: 1200,
      empleadoNombre: 'Caja Centro', items: [{ codigo: 101, nombre: 'Paracetamol', cantidad: 2, precioCentavos: 600 }],
    },
  ]
  const movements: Array<{ id: number; farmacia: number; codigo: number; cantidad: number; motivo: string; fecha: string; actor: string }> = []
  const requests: Array<{ id: number; nombre: string; correo: string; sucursal: number; rol: 'jefe' | 'empleado'; estado: 'pendiente' | 'aprobada' | 'rechazada' }> = [
    { id: 51, nombre: 'Nuevo Operador', correo: 'nuevo@vitafarma.test', sucursal: 1, rol: 'jefe', estado: 'pendiente' },
  ]
  const staff = [
    { sub: '22222222-2222-4222-8222-222222222222', nombre: 'Caja Centro', correo: 'caja.centro@vitafarma.test', rol: 'empleado' as const, sucursal: 1, activo: true, sePuedeDesactivar: true },
  ]
  const localCatalog = structuredClone(catalogByBranch)

  await context.route('**/api/v1/comercio/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname.replace(/^\/api\/v1\/comercio/, '')
    const method = req.method()

    if (path === '/sucursales' && method === 'GET') {
      return route.fulfill({ json: branches })
    }
    if (path === '/catalogo' && method === 'GET') {
      const branchId = Number(url.searchParams.get('farmacia') ?? '1')
      const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      const rows = (localCatalog[branchId] ?? []).filter(item =>
        !q || `${item.nombre} ${item.codigo} ${item.presentacion}`.toLowerCase().includes(q),
      )
      return route.fulfill({ json: rows })
    }
    if (path === '/zonas' && method === 'GET') {
      const branchId = Number(url.searchParams.get('farmacia') ?? '1')
      return route.fulfill({ json: zonesByBranch[branchId] ?? [] })
    }
    if (path === '/categorias' && method === 'GET') {
      return route.fulfill({ json: [{ id: 1, nombre: 'Medicamentos' }, { id: 2, nombre: 'Insumos' }, { id: 3, nombre: 'Cuidado personal' }] })
    }
    if (path === '/identidad' && method === 'GET') {
      return route.fulfill({ json: identity })
    }
    if (path === '/pedidos' && method === 'POST') {
      const body = req.postDataJSON() as {
        operacionId: string; farmacia: number; modalidad: 'retiro' | 'envio'; zona?: number; direccion?: string
        items: Array<{ codigo: number; cantidad: number }>; totalEsperadoCentavos: number
      }
      operationIds.push(body.operacionId)
      if (failOrderOnce) {
        failOrderOnce = false
        return route.fulfill({ status: 503, json: { statusCode: 503, code: 'UNAVAILABLE', message: 'Temporal' } })
      }
      const catalog = localCatalog[body.farmacia] ?? []
      const lines = body.items.map(line => {
        const product = catalog.find(p => p.codigo === line.codigo)!
        return { codigo: line.codigo, nombre: product.nombre, cantidad: line.cantidad, precioCentavos: product.precioCentavos }
      })
      const shipping = body.modalidad === 'envio' ? 800 : 0
      const order: OrderRecord = {
        id: 400 + orders.length + 1,
        farmacia: body.farmacia,
        modalidad: body.modalidad,
        estado: 'listo',
        fecha: '2026-11-22T15:00:00Z',
        vence: '2026-11-25T15:00:00Z',
        totalCentavos: lines.reduce((sum, l) => sum + l.precioCentavos * l.cantidad, shipping),
        envioCentavos: shipping,
        ...(body.modalidad === 'retiro' ? { codigoRetiro: '654321' } : { direccion: body.direccion }),
        pago: 'simulado',
        items: lines,
        venta: {
          id: 800 + orders.length + 1,
          farmacia: body.farmacia,
          fecha: '2026-11-22T15:05:00Z',
          canal: 'online',
          totalCentavos: lines.reduce((sum, l) => sum + l.precioCentavos * l.cantidad, shipping),
          items: lines,
        },
      }
      orders.unshift(order)
      return route.fulfill({ status: 201, json: order })
    }
    if (path === '/pedidos' && method === 'GET') {
      return route.fulfill({ json: orders })
    }
    if (/^\/pedidos\/\d+\/accion$/.test(path) && method === 'POST') {
      const id = Number(path.split('/')[2])
      const body = req.postDataJSON() as { accion: string; codigoRetiro?: string }
      const order = orders.find(o => o.id === id)
      if (!order) return route.fulfill({ status: 404, json: { message: 'No encontrado' } })
      if (body.accion === 'cancelar') {
        order.estado = 'cancelado'
        order.pago = 'revertido'
      } else if (body.accion === 'tomar') {
        order.estado = 'en_preparacion'
        order.asignado = '11111111-1111-4111-8111-111111111111'
      } else if (body.accion === 'preparar') {
        order.estado = 'listo'
        order.codigoRetiro = '654321'
      } else if (body.accion === 'entregar') {
        order.estado = 'entregado'
        order.venta = {
          id: 901, farmacia: order.farmacia, fecha: '2026-11-22T16:00:00Z',
          canal: 'online', totalCentavos: order.totalCentavos, items: order.items,
        }
      }
      return route.fulfill({ status: 201, json: order })
    }
    if (path === '/cola' && method === 'GET') {
      return route.fulfill({ json: orders })
    }
    if (path === '/caja' && method === 'POST') {
      const body = req.postDataJSON() as { farmacia: number; items: Array<{ codigo: number; cantidad: number }>; totalEsperadoCentavos: number }
      const catalog = localCatalog[body.farmacia] ?? []
      const lines = body.items.map(line => {
        const product = catalog.find(p => p.codigo === line.codigo)!
        return { codigo: line.codigo, nombre: product.nombre, cantidad: line.cantidad, precioCentavos: product.precioCentavos }
      })
      const newSale = {
        id: 700 + sales.length + 1,
        farmacia: body.farmacia,
        fecha: '2026-11-22T16:10:00Z',
        canal: 'presencial' as const,
        totalCentavos: body.totalEsperadoCentavos,
        empleadoNombre: 'Jefatura Centro',
        items: lines,
      }
      sales.unshift(newSale)
      return route.fulfill({ status: 201, json: newSale })
    }
    if (path === '/historial' && method === 'GET') {
      return route.fulfill({
        json: {
          ventas: sales,
          ranking: [{ farmacia: 1, nombre: 'Sucursal Centro', totalCentavos: sales.reduce((s, v) => s + v.totalCentavos, 0), unidades: 2, ventas: sales.length }],
        },
      })
    }
    if (path === '/movimientos' && method === 'GET') {
      return route.fulfill({ json: movements })
    }
    if (path === '/stock' && method === 'POST') {
      const body = req.postDataJSON() as { farmacia: number; codigo: number; cantidad: number; motivo: string }
      const entry = { id: movements.length + 1, farmacia: body.farmacia, codigo: body.codigo, cantidad: body.cantidad, motivo: body.motivo, fecha: '2026-11-22T16:20:00Z', actor: 'supervisor' }
      movements.unshift(entry)
      return route.fulfill({ status: 201, json: entry })
    }
    if (path === '/productos' && method === 'POST') {
      const body = req.postDataJSON() as { farmacia: number; categoria: number; nombre: string; presentacion: string; precioCentavos: number }
      const created = { codigo: 100501, nombre: body.nombre, presentacion: body.presentacion, precioCentavos: body.precioCentavos, disponible: 0 }
      localCatalog[body.farmacia]?.push(created)
      return route.fulfill({ status: 201, json: created })
    }
    if (path === '/accesos/solicitudes' && method === 'GET') {
      return route.fulfill({ json: { solicitudes: requests } })
    }
    if (/^\/accesos\/solicitudes\/\d+$/.test(path) && method === 'PATCH') {
      const id = Number(path.split('/').pop())
      const body = req.postDataJSON() as { estado: 'aprobada' | 'rechazada' }
      const target = requests.find(r => r.id === id)
      if (target) target.estado = body.estado
      return route.fulfill({ json: { id, estado: body.estado } })
    }
    if (path === '/accesos/personal' && method === 'GET') {
      return route.fulfill({ json: { personal: staff } })
    }
    return route.fulfill({ status: 404, json: { message: 'Ruta de comercio no simulada: ' + path } })
  })

  return { operationIds, orders, sales, movements, requests }
}

async function seedAuth(page: Page) {
  await page.addInitScript(({ key, session }) => {
    window.localStorage.setItem(key, JSON.stringify(session))
  }, { key: storageKey, session: testSession() })
}

test('catálogo renderiza imágenes reales sin fondo para cada medicamento y elimina el modelo 3D', async ({ page, context }) => {
  await mockCommerceApi(context)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })

  await page.goto('/')
  await expect(page).toHaveTitle('VitaFarma · Farmacia en línea')
  await expect(page.getByRole('heading', { name: 'Tu farmacia en línea.' })).toBeVisible()
  await expect(page.locator('.vf-product')).toHaveCount(12)

  // Verificar ausencia total de los dibujos CSS anteriores y del modelo 3D
  await expect(page.locator('.vf-pack-scene')).toHaveCount(0)
  await expect(page.getByText('Ver envase 3D')).toHaveCount(0)
  await expect(page.locator('.commerce-preview')).toHaveCount(0)
  await expect(page.locator('.commerce-model')).toHaveCount(0)

  // Decodificar y validar todas las imágenes de productos y el hero WebP
  const imageReport = await page.evaluate(async () => {
    const hero = document.querySelector<HTMLImageElement>('.vf-hero img')!
    await hero.decode()
    const productImgs = [...document.querySelectorAll<HTMLImageElement>('.vf-product-media img')]
    for (const img of productImgs) {
      img.loading = 'eager'
      await img.decode()
    }
    return {
      heroLoaded: hero.complete && hero.naturalWidth > 0,
      heroCurrentSrc: hero.currentSrc,
      productCount: productImgs.length,
      allLoaded: productImgs.every(img => img.complete && img.naturalWidth === 440 && img.naturalHeight === 340),
      uniqueSources: new Set(productImgs.map(img => new URL(img.src).pathname)).size,
      allUnderProductsDir: productImgs.every(img => new URL(img.src).pathname.startsWith('/images/productos/') && img.src.endsWith('.webp')),
    }
  })

  expect(imageReport.heroLoaded).toBe(true)
  expect(imageReport.heroCurrentSrc).toContain('/images/mostrador.webp')
  expect(imageReport.productCount).toBe(12)
  expect(imageReport.allLoaded).toBe(true)
  expect(imageReport.uniqueSources).toBe(12)
  expect(imageReport.allUnderProductsDir).toBe(true)
  expect(errors).toEqual([])
})

test('búsqueda, filtros por presentación, carrito, límites y cambio de sucursal con confirmación', async ({ page, context }) => {
  await mockCommerceApi(context)
  await page.goto('/')
  await expect(page.locator('.vf-product')).toHaveCount(12)

  // Búsqueda sin coincidencias y recuperación
  await page.getByRole('searchbox', { name: 'Buscar productos' }).fill('inexistente-xyz')
  await page.getByRole('button', { name: 'Buscar productos' }).click()
  await expect(page.getByText('No encontramos productos para esa búsqueda.')).toBeVisible()
  await page.getByRole('button', { name: 'Ver todos los productos' }).click()
  await expect(page.locator('.vf-product')).toHaveCount(12)

  // Filtros rápidos por presentación
  const frascos = page.getByRole('button', { name: 'Frascos', exact: true })
  await frascos.click()
  await expect(frascos).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.vf-product')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Protector solar' })).toBeVisible()

  await page.getByRole('button', { name: 'Todos', exact: true }).click()
  await expect(page.locator('.vf-product')).toHaveCount(12)

  // Agregar al carrito, respetar límite de stock, abrir drawer y eliminar
  const addThermometer = page.getByRole('button', { name: 'Agregar Termómetro' })
  await addThermometer.click()
  await expect(addThermometer).toBeDisabled()
  const cartTrigger = page.getByRole('button', { name: /^Carrito/ })
  await expect(cartTrigger).toHaveText(/Carrito\s*1/)

  await cartTrigger.click()
  const drawer = page.getByRole('dialog', { name: 'Tu carrito' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('button', { name: 'Añadir una unidad de Termómetro' })).toBeDisabled()
  await drawer.getByRole('button', { name: 'Eliminar Termómetro del carrito' }).click()
  await expect(drawer.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(cartTrigger).toBeFocused()

  // Cambio de sucursal con carrito activo
  await page.getByRole('button', { name: 'Agregar Paracetamol' }).click()
  const branchSelect = page.getByRole('combobox', { name: /Sucursal/ })
  await branchSelect.selectOption('2')
  await expect(page.getByRole('alert')).toContainText('se vaciará tu carrito')
  await page.getByRole('button', { name: 'Mantener sucursal' }).click()
  await expect(cartTrigger).toHaveText(/Carrito\s*1/)

  await branchSelect.selectOption('2')
  await page.getByRole('button', { name: 'Cambiar sucursal' }).click()
  await expect(cartTrigger).toHaveText(/Carrito\s*0/)
  // Producto nuevo en Sucursal Norte (código 999) recibe imagen transparente de respaldo por palabra clave
  await expect(page.getByRole('heading', { name: 'Ibuprofeno 400 mg' })).toBeVisible()
  const fallbackLoaded = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll<HTMLImageElement>('.vf-product-media img')]
    for (const img of imgs) { img.loading = 'eager'; await img.decode() }
    return imgs.every(img => img.complete && img.naturalWidth > 0)
  })
  expect(fallbackLoaded).toBe(true)
})

test('checkout completo: ingreso, envío con tarifa, reintento idempotente, comprobante y cancelación', async ({ page, context }) => {
  const api = await mockCommerceApi(context, { failFirstOrder: true })
  await page.goto('/')
  await page.getByRole('button', { name: 'Agregar Cinta médica' }).click()
  await page.getByRole('button', { name: /^Carrito/ }).click()
  await page.getByRole('link', { name: 'Ingresar para comprar' }).click()

  await expect(page).toHaveURL(/\/tienda\/entrar\?volver=carrito/)
  await page.getByLabel('Correo electrónico').fill(testEmail)
  await page.getByLabel('Contraseña', { exact: true }).fill(testPassword)
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()

  await expect(page).toHaveURL(/\/tienda\?carrito=1/)
  const drawer = page.getByRole('dialog', { name: 'Tu carrito' })
  await expect(drawer.getByText('Cinta médica', { exact: true })).toBeVisible()

  // Comparar total entre retiro y envío
  const totalLabel = drawer.locator('.commerce-total strong')
  const pickupTotal = await totalLabel.textContent()
  await drawer.getByLabel('Envío a domicilio').check()
  await drawer.getByLabel('Zona de entrega').selectOption('10')
  await expect(totalLabel).not.toHaveText(pickupTotal!)
  await drawer.getByLabel('Retiro en sucursal').check()
  await expect(totalLabel).toHaveText(pickupTotal!)

  // Primer envío falla con 503 → reintento idempotente con mismo operacionId
  await drawer.getByRole('button', { name: /Pagar · simulación/ }).click()
  await expect(drawer.getByRole('button', { name: 'Verificar el pago' })).toBeVisible()
  await drawer.getByRole('button', { name: 'Verificar el pago' }).click()

  expect(api.operationIds).toHaveLength(2)
  expect(api.operationIds[0]).toBe(api.operationIds[1])

  // Redirección a Mis pedidos, código de retiro, comprobante y cancelación
  await expect(page).toHaveURL(/\/tienda\/pedidos\?pedido=401/)
  const card = page.locator('#pedido-401')
  await expect(card.locator('.commerce-pickup-code strong')).toHaveText('654321')
  await card.getByRole('button', { name: 'Ver comprobante' }).click()
  const receipt = page.getByRole('dialog')
  await expect(receipt).toBeVisible()
  await expect(receipt.getByRole('button', { name: /Imprimir/ })).toBeVisible()
  await receipt.getByRole('button', { name: 'Cerrar comprobante' }).click()
  await expect(receipt).toBeHidden()

  await card.getByRole('button', { name: 'Cancelar pedido' }).click()
  await card.getByRole('button', { name: 'Confirmar cancelación' }).click()
  await expect(card.getByText('Cancelado')).toBeVisible()
  await expect(card.getByText('Pago de prueba revertido')).toBeVisible()
})

test('operaciones de caja y pedidos: tomar, preparar, entregar y venta presencial', async ({ page, context }) => {
  await seedAuth(page)
  const api = await mockCommerceApi(context, {
    identity: {
      tipo: 'personal',
      nombre: 'Jefatura Centro',
      sucursales: [{ id: 1, nombre: 'Sucursal Centro', departamento: 'Cochabamba', rol: 'jefe' }],
    },
  })
  api.orders.push({
    id: 501, farmacia: 1, modalidad: 'retiro', estado: 'confirmado', fecha: '2026-11-22T15:30:00Z',
    totalCentavos: 600, envioCentavos: 0, pago: 'simulado',
    items: [{ codigo: 101, nombre: 'Paracetamol', cantidad: 1, precioCentavos: 600 }],
  })

  await page.goto(`${commerceOrigin}/operaciones`)
  await expect(page.getByRole('heading', { name: 'Operaciones de sucursal' })).toBeVisible()
  const orderCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Pedido #501' }) })
  await orderCard.getByRole('button', { name: 'Tomar pedido' }).click()
  await orderCard.getByRole('button', { name: 'Marcar como listo' }).click()
  await orderCard.getByRole('button', { name: 'Registrar retiro' }).click()
  await orderCard.getByLabel('Código de retiro').fill('654321')
  await orderCard.getByRole('button', { name: 'Confirmar retiro' }).click()
  await expect(orderCard.getByText('Entregado')).toBeVisible()

  // Caja presencial (lazy-loaded)
  await page.getByRole('button', { name: 'Caja presencial' }).click()
  await expect(page.getByRole('heading', { name: 'Caja presencial' })).toBeVisible()
  await page.getByRole('button', { name: 'Agregar Paracetamol' }).click()
  await page.getByRole('button', { name: 'Confirmar venta' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar comprobante' }).click()
})

test('supervisión: historial con ranking, alta de producto y aprobación de personal', async ({ page, context }) => {
  await seedAuth(page)
  await mockCommerceApi(context, {
    identity: {
      tipo: 'personal',
      nombre: 'Supervisión Cochabamba',
      sucursales: [{ id: 1, nombre: 'Sucursal Centro', departamento: 'Cochabamba', rol: 'supervisor' }],
    },
  })

  await page.goto(`${commerceOrigin}/operaciones`)
  await page.getByRole('button', { name: 'Historial de ventas' }).click()
  await expect(page.getByRole('heading', { name: 'Historial de ventas' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Caja Centro' })).toBeVisible()

  await page.getByRole('button', { name: 'Stock y catálogo' }).click()
  await page.getByLabel('Nombre del producto').fill('Ibuprofeno 400 mg')
  await page.getByLabel('Presentación').fill('Caja')
  await page.getByLabel('Categoría').selectOption('1')
  await page.getByLabel('Precio (Bs)').fill('18.50')
  await page.getByRole('button', { name: 'Guardar producto' }).click()
  await expect(page.getByText(/Ibuprofeno 400 mg · código 100501/)).toBeVisible()

  await page.getByRole('button', { name: 'Personal y accesos' }).click()
  await expect(page.getByText('Nuevo Operador')).toBeVisible()
  await page.getByRole('button', { name: 'Aprobar' }).click()
  await expect(page.getByText('Solicitud aprobada.')).toBeVisible()
})

for (const width of [360, 768, 1280]) {
  test(`tienda responsive, teclado y movimiento reducido a ${width}px`, async ({ page, context }, info) => {
    await mockCommerceApi(context)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('.vf-product')).toHaveCount(12)
    await page.evaluate(async () => {
      await document.fonts.ready
      const imgs = [...document.querySelectorAll<HTMLImageElement>('img')]
      for (const img of imgs) { img.loading = 'eager'; await img.decode() }
    })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const copyBox = await page.locator('.vf-hero-copy').boundingBox()
    const photoBox = await page.locator('.vf-hero-picture').boundingBox()
    expect(photoBox!.x).toBeGreaterThanOrEqual(copyBox!.x + copyBox!.width - 2)
    await page.screenshot({ path: info.outputPath(`tienda-${width}.png`), fullPage: true })

    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Saltar al catálogo' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#store-products')).toBeFocused()
  })
}
