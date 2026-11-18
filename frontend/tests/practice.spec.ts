import { test, expect } from './auth.mock'

test('gestión de clientes permite alta, edición y borrado confirmado', async ({ page, context }) => {
  const clients: { id_cliente: number; nombres: string }[] = []
  await context.route('**/api/v1/me', r => r.fulfill({ json: { sub: 'sintetico', perfil: 'responsable', sucursales: [1] } }))
  await context.route('**/api/v1/practica/recursos', r => r.fulfill({ json: { recursos: [{
    clave: 'clientes', titulo: 'Clientes', id: 'id_cliente', columnas: ['id_cliente','nombres'],
    campos: [{ clave: 'nombres', etiqueta: 'Nombres', tipo: 'texto', requerido: true, max: 100 }],
  }] } }))
  await context.route('**/api/v1/practica/registros/clientes**', r => {
    const method = r.request().method()
    if (method === 'GET') return r.fulfill({ json: { filas: clients, total: clients.length } })
    if (method === 'DELETE') { clients.splice(0); return r.fulfill({ status: 204 }) }
    const row = { id_cliente: 12, nombres: r.request().postDataJSON().nombres as string }
    clients.splice(0,clients.length,row)
    return r.fulfill({ status: method === 'POST' ? 201 : 200, json: row })
  })
  await page.goto('/practica/clientes')
  await page.getByRole('button', { name: 'Nuevo registro' }).click()
  await page.getByLabel('Nombres').fill('Persona de prueba')
  await page.getByRole('button', { name: 'Guardar registro' }).click()
  await expect(page.getByRole('cell', { name: 'Persona de prueba' })).toBeVisible()
  await page.getByRole('button', { name: 'Editar registro 12' }).click()
  await page.getByLabel('Nombres').fill('Registro actualizado')
  await page.getByRole('button', { name: 'Guardar registro' }).click()
  await expect(page.getByRole('cell', { name: 'Registro actualizado' })).toBeVisible()
  await page.getByRole('button', { name: 'Eliminar registro 12' }).click()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  expect(clients).toHaveLength(1)
  await page.getByRole('button', { name: 'Eliminar registro 12' }).click()
  await page.getByRole('button', { name: 'Confirmar eliminación' }).click()
  await expect(page.getByText('Todavía no hay registros.')).toBeVisible()
})

test('una venta reintenta la misma operación tras perder la confirmación y abre su detalle', async ({ page, context }) => {
  const keys: string[] = []
  const result = { venta: { id_venta: 14, id_farmacia: 1, id_empleado: 1, id_cliente: 1, fecha_hora: '2026-11-18', total_cobrado: '6.50' }, detalles: [{ codigo_producto: 1, nombre: 'Producto de práctica', cantidad: 1, precio_historico: '6.50' }] }
  await context.route('**/api/v1/me', r => r.fulfill({ json: { sub: 'sintetico', perfil: 'responsable', sucursales: [1] } }))
  await context.route('**/api/v1/practica/opciones/**', r => r.fulfill({ json: { filas: [{ id: 1, nombre: 'Opción de práctica' }], total: 1 } }))
  await context.route('**/api/v1/inventory/1/1', r => r.fulfill({ json: { producto: { codigo_producto: 1, nombre: 'Producto de práctica', precio_venta: 6.5 }, stock: { cantidad: 20 } } }))
  await context.route('**/api/v1/practica/ventas**', r => {
    if (r.request().method() === 'POST') {
      const data = r.request().postDataJSON()
      keys.push(data.operacionId as string)
      expect(data.items).toEqual([{codigo_producto:1,cantidad:1}])
      return keys.length === 1 ? r.abort() : r.fulfill({status:201,json:result})
    }
    return r.fulfill({json: new URL(r.request().url()).pathname.endsWith('/14') ? result : {filas:[],total:0}})
  })
  await page.goto('/practica/ventas')
  await page.getByRole('button', {name:'Nueva venta'}).click()
  await page.getByRole('group', {name:'Datos de la venta'}).getByRole('combobox', {name:'Sucursal'}).selectOption('1')
  await page.getByRole('combobox', {name:'Empleado'}).selectOption('1')
  await page.getByRole('combobox', {name:'Cliente'}).selectOption('1')
  await page.getByRole('combobox', {name:'Producto'}).selectOption('1')
  await page.getByRole('button', {name:'Añadir producto'}).click()
  await page.getByRole('button', {name:'Confirmar venta'}).click()
  await expect(page.getByRole('alert')).toContainText('no confirmó')
  await page.getByRole('button',{name:'Reintentar la misma venta'}).click()
  await expect(page.getByRole('heading',{name:'Venta #14'})).toBeVisible()
  await expect(page.getByRole('row',{name:/Producto de práctica/})).toBeVisible()
  expect(keys).toHaveLength(2)
  expect(keys[0]).toBe(keys[1])
})
