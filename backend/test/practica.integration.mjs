import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { Pool } from 'pg'
import { registrar, eliminar, listar } from '../dist/modules/sales/practica/registros.js'
import { vender, detalle } from '../dist/modules/sales/practica/ventas.js'

const responsable = {sub:'00000000-0000-4000-8000-000000000002', perfil:'responsable', sucursales:[1,2,3]}
const url = process.env.VITAFARMA_PRACTICA_WRITE_URL
const rechazado = (status) => (error) => error.getStatus?.() === status
const venta = (items, operacionId = randomUUID()) => ({operacionId,id_farmacia:2,id_empleado:2,id_cliente:1,items})
const casos = [
  ['farmacias',{id_farmacia:3,nombre:'Sucursal QA',id_ciudad:1},'nombre','Sucursal QA revisada'],
  ['empleados',{nombre_completo:'Empleado QA',id_farmacia:1,id_cargo:1},'nombre_completo','Empleado revisado'],
  ['productos',{nombre:'Producto QA',id_categoria:2,precio_compra:'4.00',precio_venta:'7.50'},'nombre','Producto revisado'],
  ['medicamentos',{codigo_producto:104,id_laboratorio:1},'accion_terapeutica','Ejemplo de práctica'],
  ['clientes',{nombres:'Cliente QA',apellidos:'Prueba'},'nombres','Cliente revisado'],
  ['descuentos',{codigo_producto:101,descripcion:'Descuento QA',porcentaje:10,fecha_inicio:'2020-01-01',fecha_fin:'2099-12-31'},'porcentaje',25],
  ['planillas',{id_empleado:1,sueldo_base:500,monto_antiguedad:20,bonos:30,descuentos:10,fecha_elaboracion:'2026-11-01'},'bonos',60],
  ['usuarios',{id_empleado:1,id_rol:1,nombre_usuario:'qa_practica',estado:'ACTIVO'},'estado','INACTIVO'],
]
const ids = ['id_farmacia','id_empleado','codigo_producto','codigo_producto','id_cliente','id_descuento','id_salario','id_usuario']

test('operaciones académicas sobre PostgreSQL con reversión de los ensayos', {skip:!url}, async () => {
  const target = new URL(url)
  assert.equal(target.hostname,'127.0.0.1')
  assert.equal(target.port,'55432')
  assert.equal(target.pathname,'/vitafarma_gestion')
  assert.equal(target.username,'vf_gestion')
  assert.equal(target.search,'')
  const pool = new Pool({connectionString:url,max:2})
  const client = await pool.connect()
  const concurrent = await pool.connect()
  try {
    await client.query('BEGIN')
    await concurrent.query('BEGIN')
    assert.equal((await client.query('SELECT version FROM practica_api.instalacion')).rows[0].version,'VF-GESTION-LOCAL-1')
    for (const [index,[clave,campos,modificar,nuevo]] of casos.entries()) {
      const registro = await registrar(client,responsable,clave,campos)
      const id = registro[ids[index]]
      const edited = await registrar(client,responsable,clave,{...campos,[modificar]:nuevo},id)
      assert.equal(String(edited[modificar]), typeof nuevo === 'number' && ['porcentaje','bonos'].includes(modificar) ? nuevo.toFixed(2) : String(nuevo))
      assert.ok((await listar(client,responsable,clave,String(id))).filas.some(x=>x[ids[index]]===id))
      if (clave==='usuarios') assert.equal('contrasena' in edited,false)
      if (clave==='planillas') assert.equal(edited.total_cobrar,'570.00')
      await eliminar(client,responsable,clave,id)
    }
    await assert.rejects(registrar(client,{...responsable,sucursales:[2]},'empleados',{nombre_completo:'QA',id_cargo:1,id_farmacia:1}),rechazado(403))
    await assert.rejects(listar(client,{...responsable,sucursales:[2]},'clientes'),rechazado(403))
    await assert.rejects(registrar(client,responsable,'usuarios',{...casos[7][1],contrasena:'oculto'}),rechazado(400))
    const consultaSaldo = 'SELECT cantidad FROM public.stock WHERE id_farmacia=2 AND codigo_producto=101'
    const saldo = (await client.query(consultaSaldo)).rows[0].cantidad
    assert.ok(saldo >= 2,'La semilla de prueba requiere 2 unidades del producto 101 en la sucursal 2.')
    const orden = venta([{codigo_producto:101,cantidad:2}])
    const first = await vender(client,responsable,orden)
    assert.equal(first.detalles[0].cantidad,2)
    assert.equal(Number(first.venta.total_cobrado),Number(first.detalles[0].precio_historico)*2)
    assert.deepEqual(await vender(client,responsable,orden),first)
    assert.deepEqual(await detalle(client,responsable,first.venta.id_venta),first)
    assert.equal((await client.query(consultaSaldo)).rows[0].cantidad,saldo-2)
    await assert.rejects(vender(client,responsable,{...orden,items:[{codigo_producto:101,cantidad:1}]}),rechazado(409))
    await assert.rejects(vender(client,responsable,venta([{codigo_producto:101,cantidad:1},{codigo_producto:112,cantidad:2}])),rechazado(409))
    assert.equal((await client.query(consultaSaldo)).rows[0].cantidad,saldo-2)
    await assert.rejects(detalle(client,{...responsable,sucursales:[1]},first.venta.id_venta),rechazado(404))

    // Un segundo cajero no puede reservar el stock hasta que termine la primera transacción.
    await concurrent.query("SET LOCAL lock_timeout='250ms'")
    await assert.rejects(vender(concurrent,responsable,venta([{codigo_producto:101,cantidad:1}])),error=>error.code==='55P03')
    await concurrent.query('ROLLBACK')
    await client.query('ROLLBACK')
    assert.equal((await concurrent.query(consultaSaldo)).rows[0].cantidad,saldo)
  } finally {
    await client.query('ROLLBACK').catch(()=>{})
    await concurrent.query('ROLLBACK').catch(()=>{})
    concurrent.release()
    client.release()
    await pool.end()
  }
})
