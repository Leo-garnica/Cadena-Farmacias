import { ConflictException, NotFoundException } from '@nestjs/common'
import type { PoolClient } from 'pg'
import { lockOperation } from './stock.js'
import { offset, pageSize } from './validation.js'

export async function branchCustomers(db: PoolClient, branch: number, query: string, first?: string) {
  return (await db.query(`SELECT c.id_cliente AS id, trim(concat_ws(' ',c.nombres,c.apellidos)) AS nombre
    FROM public.cliente c
    WHERE (EXISTS (SELECT FROM commerce.cliente_sucursal a WHERE a.cliente=c.id_cliente AND a.farmacia=$1)
      OR EXISTS (SELECT FROM commerce.pedidos p WHERE p.cliente_id=c.id_cliente AND p.farmacia=$1 AND p.venta IS NOT NULL))
      AND ($2='' OR position(lower($2) in lower(concat_ws(' ',c.nombres,c.apellidos,c.id_cliente))) > 0)
    ORDER BY nombre,c.id_cliente LIMIT $3 OFFSET $4`, [branch, query, pageSize, offset(first)])).rows
}

export async function addCounterCustomer(db: PoolClient, branch: number, first: string, last: string) {
  const { rows } = await db.query<{ id: number; nombre: string }>(`
    INSERT INTO public.cliente(id_cliente,nombres,apellidos)
    VALUES(nextval('practica_api.identificador'),$1,$2)
    RETURNING id_cliente AS id, trim(concat_ws(' ',nombres,apellidos)) AS nombre`, [first, last])
  await db.query('INSERT INTO commerce.cliente_sucursal(farmacia,cliente) VALUES($1,$2)', [branch, rows[0].id])
  return rows[0]
}

export async function categories(db: PoolClient) {
  return (await db.query('SELECT id_categoria AS id,nombre FROM public.categoria ORDER BY nombre,id_categoria')).rows
}

interface ProductInput {
  operacion: string; solicitud: string; farmacia: number; categoria: number
  nombre: string; presentacion: string; precioCentavos: number
}

export async function addProduct(db: PoolClient, sub: string, input: ProductInput) {
  const { operacion, solicitud, farmacia, categoria, nombre, presentacion, precioCentavos } = input
  await lockOperation(db, operacion)
  const previous = (await db.query<{ actor: string; solicitud: string; codigo: number }>(
    'SELECT actor,solicitud,codigo FROM commerce.productos_altas WHERE operacion=$1', [operacion],
  )).rows[0]
  if (previous) {
    if (previous.actor !== sub || previous.solicitud !== solicitud) throw new ConflictException()
    return { codigo: previous.codigo, nombre, presentacion, precioCentavos, disponible: 0 }
  }
  if (!(await db.query('SELECT FROM public.categoria WHERE id_categoria=$1 FOR SHARE', [categoria])).rowCount) {
    throw new NotFoundException()
  }
  const { rows } = await db.query<{ codigo: number }>(`
    INSERT INTO public.producto(codigo_producto,id_categoria,nombre,presentacion,precio_venta)
    VALUES(nextval('practica_api.identificador'),$1,$2,$3,$4::numeric/100) RETURNING codigo_producto AS codigo`,
  [categoria, nombre, presentacion, precioCentavos])
  const { codigo } = rows[0]
  await db.query('INSERT INTO public.stock(id_farmacia,codigo_producto,cantidad) VALUES($1,$2,0)', [farmacia, codigo])
  await db.query('INSERT INTO commerce.productos_altas(operacion,actor,solicitud,codigo,farmacia) VALUES($1,$2,$3,$4,$5)',
    [operacion, sub, solicitud, codigo, farmacia])
  return { codigo, nombre, presentacion, precioCentavos, disponible: 0 }
}
