import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { Pool } from 'pg'
import { ConexionPractica } from '../dist/modules/sales/practica/conexion.js'
import { registrar, eliminar, listar } from '../dist/modules/sales/practica/registros.js'
import { vender, detalle } from '../dist/modules/sales/practica/ventas.js'

const responsable = {sub:'00000000-0000-4000-8000-000000000002', perfil:'responsable', sucursales:[1,2,3]}
const url = process.env.VITAFARMA_PRACTICA_WRITE_URL
const rechazado = (status) => (error) => error.getStatus?.() === status
const venta = (items, operacionId = randomUUID()) => ({operacionId,id_farmacia:2,id_empleado:2,id_cliente:1,items})
const formularios = (farmacia,producto,empleado) => [
  ['farmacias',{id_farmacia:farmacia,nombre:'Sucursal QA',id_ciudad:1},'nombre','Sucursal QA revisada'],
  ['empleados',{nombre_completo:'Empleado QA',id_farmacia:1,id_cargo:1},'nombre_completo','Empleado revisado'],
  ['productos',{nombre:'Producto QA',id_categoria:2,precio_compra:'4.00',precio_venta:'7.50'},'nombre','Producto revisado'],
  ['medicamentos',{codigo_producto:producto,id_laboratorio:1},'accion_terapeutica','Ejemplo de práctica'],
  ['clientes',{nombres:'Cliente QA',apellidos:'Prueba'},'nombres','Cliente revisado'],
  ['descuentos',{codigo_producto:101,descripcion:'Descuento QA',porcentaje:10,fecha_inicio:'2020-01-01',fecha_fin:'2099-12-31'},'porcentaje',25],
  ['planillas',{id_empleado:empleado,sueldo_base:500,monto_antiguedad:20,bonos:30,descuentos:10,fecha_elaboracion:'2026-11-01'},'bonos',60],
  ['usuarios',{id_empleado:empleado,id_rol:1,nombre_usuario:'qa_practica',estado:'ACTIVO'},'estado','INACTIVO'],
]
const ids = ['id_farmacia','id_empleado','codigo_producto','codigo_producto','id_cliente','id_descuento','id_salario','id_usuario']

test('la escritura exige perfil responsable, sucursal, Auth local y lectores del mismo destino', async () => {
  const service = new ConexionPractica()
  const keys = ['SUPABASE_URL','DATABASE_URL','VITAFARMA_PRACTICA_WRITE_URL']
  const original = new Map(keys.map(key=>[key,process.env[key]]))
  try {
    const options = {
      SUPABASE_URL:'http://127.0.0.1:55433',
      DATABASE_URL:'postgresql://vf_lector:prueba@127.0.0.1:55432/vitafarma_gestion',
      VITAFARMA_PRACTICA_WRITE_URL:'postgresql://vf_gestion:prueba@127.0.0.1:55432/vitafarma_gestion',
    }
    const denied = async (acceso) => assert.rejects(service.usar(acceso,()=>assert.fail('Se invocó una escritura')),rechazado(403))
    Object.assign(process.env,options)
    await denied({...responsable,perfil:'consulta'})
    await denied({...responsable,sucursales:[]})
    for (const [key,value] of [
      ['DATABASE_URL',options.DATABASE_URL.replace('vitafarma_gestion','vitafarma_practica')],
      ['VITAFARMA_PRACTICA_WRITE_URL',options.VITAFARMA_PRACTICA_WRITE_URL.replace('vf_gestion','postgres')],
      ['VITAFARMA_PRACTICA_WRITE_URL',options.VITAFARMA_PRACTICA_WRITE_URL+'?sslmode=require'],
      ['SUPABASE_URL','https://example.invalid'],
    ]) {
      Object.assign(process.env,options,{[key]:value})
      await denied(responsable)
    }
  } finally {
    for(const [key,value] of original) { if(value === undefined) delete process.env[key]; else process.env[key]=value }
    await service.onModuleDestroy()
  }
})

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
    const sucursales = (await client.query('SELECT id_farmacia FROM public.farmacia')).rows.map(r=>r.id_farmacia)
    const farmacia = (await client.query("SELECT nextval('practica_api.identificador')::int AS n")).rows[0].n
    const acceso = {...responsable,sucursales:[...sucursales,farmacia]}
    const producto = (await registrar(client,acceso,'productos',{nombre:'Producto de ensayo',id_categoria:1,precio_compra:1,precio_venta:2})).codigo_producto
    const empleado = (await registrar(client,acceso,'empleados',{nombre_completo:'Empleado de ensayo',id_farmacia:1,id_cargo:1})).id_empleado
    const casos = formularios(farmacia,producto,empleado)
    // La FK de la fila insertada mantiene KEY SHARE. Ese lock sí permite un traslado;
    // el repositorio debe adquirir SHARE sobre el dueño anterior al editar o borrar.
    for (const operacion of ['editar','borrar']) {
      await client.query('SAVEPOINT prueba_traslado')
      const payroll = (await client.query(`INSERT INTO public.salario (id_salario,id_empleado,sueldo_base)
        VALUES(nextval('practica_api.identificador'),1,40) RETURNING id_salario`)).rows[0].id_salario
      await concurrent.query('SELECT id_empleado FROM public.empleado WHERE id_empleado=1 FOR NO KEY UPDATE NOWAIT')
      await concurrent.query('ROLLBACK')
      await concurrent.query('BEGIN')
      if (operacion === 'editar') await registrar(client,acceso,'planillas',casos[6][1],payroll)
      else await eliminar(client,acceso,'planillas',payroll)
      await assert.rejects(concurrent.query('SELECT id_empleado FROM public.empleado WHERE id_empleado=1 FOR NO KEY UPDATE NOWAIT'),
        error=>error.code==='55P03')
      await concurrent.query('ROLLBACK')
      await concurrent.query('BEGIN')
      await client.query('ROLLBACK TO SAVEPOINT prueba_traslado')
      await client.query('RELEASE SAVEPOINT prueba_traslado')
    }
    for (const [index,[clave,campos,modificar,nuevo]] of casos.entries()) {
      const registro = await registrar(client,acceso,clave,campos)
      const id = registro[ids[index]]
      const edited = await registrar(client,acceso,clave,{...campos,[modificar]:nuevo},id)
      assert.equal(String(edited[modificar]), typeof nuevo === 'number' && ['porcentaje','bonos'].includes(modificar) ? nuevo.toFixed(2) : String(nuevo))
      assert.ok((await listar(client,acceso,clave,String(id))).filas.some(x=>x[ids[index]]===id))
      if (clave==='usuarios') assert.equal('contrasena' in edited,false)
      if (clave==='planillas') assert.equal(edited.total_cobrar,'570.00')
      await eliminar(client,acceso,clave,id)
    }
    await assert.rejects(registrar(client,{...responsable,sucursales:[2]},'empleados',{nombre_completo:'QA',id_cargo:1,id_farmacia:1}),rechazado(403))
    await assert.rejects(listar(client,{...responsable,sucursales:[2]},'clientes'),rechazado(403))
    await assert.rejects(registrar(client,acceso,'usuarios',{...casos[7][1],contrasena:'oculto'}),rechazado(400))
    const consultaSaldo = 'SELECT cantidad FROM public.stock WHERE id_farmacia=2 AND codigo_producto=101'
    const saldoOriginal = (await client.query(consultaSaldo)).rows[0].cantidad
    const saldo = 8
    await client.query('UPDATE public.stock SET cantidad=$1 WHERE id_farmacia=2 AND codigo_producto=101',[saldo])
    const orden = venta([{codigo_producto:101,cantidad:2}])
    await assert.rejects(vender(client,{...acceso,sucursales:[2]},orden),rechazado(403))
    const first = await vender(client,acceso,orden)
    assert.equal(first.detalles[0].cantidad,2)
    assert.equal(Number(first.venta.total_cobrado),Number(first.detalles[0].precio_historico)*2)
    assert.deepEqual(await vender(client,acceso,orden),first)
    await assert.rejects(vender(client,{...acceso,sub:randomUUID()},orden),rechazado(409))
    assert.deepEqual(await detalle(client,acceso,first.venta.id_venta),first)
    assert.equal((await client.query(consultaSaldo)).rows[0].cantidad,saldo-2)
    await assert.rejects(vender(client,acceso,{...orden,items:[{codigo_producto:101,cantidad:1}]}),rechazado(409))
    await assert.rejects(vender(client,acceso,venta([{codigo_producto:101,cantidad:1},{codigo_producto:112,cantidad:2}])),rechazado(409))
    assert.equal((await client.query(consultaSaldo)).rows[0].cantidad,saldo-2)
    await assert.rejects(detalle(client,{...responsable,sucursales:[1]},first.venta.id_venta),rechazado(404))

    // Un segundo cajero no puede reservar el stock hasta que termine la primera transacción.
    await concurrent.query("SET LOCAL lock_timeout='250ms'")
    await assert.rejects(vender(concurrent,acceso,venta([{codigo_producto:101,cantidad:1}])),error=>error.code==='55P03')
    await concurrent.query('ROLLBACK')
    await client.query('ROLLBACK')
    assert.equal((await concurrent.query(consultaSaldo)).rows[0].cantidad,saldoOriginal)
  } finally {
    await client.query('ROLLBACK').catch(()=>{})
    await concurrent.query('ROLLBACK').catch(()=>{})
    concurrent.release()
    client.release()
    await pool.end()
  }
})
