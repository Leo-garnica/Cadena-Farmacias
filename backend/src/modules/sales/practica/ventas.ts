import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import type { PoolClient } from 'pg'
import type { AccessGrant } from '../../access/public.js'
import { exigirGlobal } from './registros.js'
import { entero, objeto, offsetValido } from './validacion.js'

const seleccion = `SELECT v.id_venta,v.id_cliente,v.id_empleado,e.id_farmacia,v.fecha_hora::text,v.total_cobrado
  FROM public.venta v JOIN public.empleado e ON e.id_empleado=v.id_empleado
  WHERE e.id_farmacia=ANY($1::integer[])`

export async function ventas(db: PoolClient, access: AccessGrant, offset?: string) {
  const args = [access.sucursales]
  const total = (await db.query('SELECT count(*)::int AS n FROM ('+seleccion+') ventas',args)).rows[0].n
  const filas = (await db.query(seleccion+' ORDER BY v.id_venta DESC LIMIT 30 OFFSET $2',[...args,offsetValido(offset)])).rows
  return {filas,total}
}
export async function detalle(db: PoolClient, access: AccessGrant, id: number) {
  const venta = (await db.query(seleccion+' AND v.id_venta=$2',[access.sucursales,id])).rows[0]
  if (!venta) throw new NotFoundException()
  const detalles = (await db.query(`SELECT d.codigo_producto,p.nombre,d.cantidad,d.precio_historico
    FROM public.detalle_venta d JOIN public.producto p USING(codigo_producto)
    WHERE d.id_venta=$1 ORDER BY d.id_detalle`,[id])).rows
  return {venta,detalles}
}

function pedido(entrada: unknown) {
  const body = objeto(entrada)
  if (Object.keys(body).some(k=>!['operacionId','id_farmacia','id_empleado','id_cliente','items'].includes(k)) ||
      typeof body.operacionId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu.test(body.operacionId) ||
      !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) throw new BadRequestException()
  const items = body.items.map((entry: unknown) => {
    const line = objeto(entry)
    if (Object.keys(line).some(k=>!['codigo_producto','cantidad'].includes(k))) throw new BadRequestException()
    return {codigo_producto:entero(line.codigo_producto),cantidad:entero(line.cantidad)}
  }).sort((a,b)=>a.codigo_producto-b.codigo_producto)
  if (new Set(items.map(i=>i.codigo_producto)).size !== items.length) throw new BadRequestException()
  return {key:body.operacionId.toLowerCase(), farmacia:entero(body.id_farmacia), empleado:entero(body.id_empleado),cliente:entero(body.id_cliente),items}
}

export async function vender(db: PoolClient, access: AccessGrant, entrada: unknown) {
  const {key,...orden} = pedido(entrada)
  if (!access.sucursales.includes(orden.farmacia)) throw new ForbiddenException()
  await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 401))',[key])
  const body = JSON.stringify(orden)
  const previa = (await db.query('SELECT actor,contenido,venta FROM practica_api.operacion_venta WHERE operacion=$1',[key])).rows[0]
  if (previa) {
    if (previa.actor !== access.sub || previa.contenido !== body) throw new ConflictException()
    return detalle(db,access,previa.venta)
  }
  // El alta referencia el catálogo global de clientes, bajo el mismo permiso que el selector.
  await exigirGlobal(db,access)
  // La copia de pruebas demuestra las escrituras sin instalar los triggers académicos.
  // Una copia con lógica de venta distinta exige revisar quién descuenta el inventario.
  if ((await db.query(`SELECT FROM pg_trigger WHERE NOT tgisinternal AND tgenabled IN ('O','A')
    AND tgrelid IN ('public.venta'::regclass,'public.detalle_venta'::regclass,'public.stock'::regclass) LIMIT 1`)).rowCount) throw new ConflictException()
  if (!(await db.query('SELECT FROM public.empleado WHERE id_empleado=$1 AND id_farmacia=$2 FOR SHARE',[orden.empleado,orden.farmacia])).rowCount ||
      !(await db.query('SELECT FROM public.cliente WHERE id_cliente=$1 FOR SHARE',[orden.cliente])).rowCount) throw new NotFoundException()

  // Orden estable de locks y stock revalidado después de la espera.
  const lineas = []
  let totalCentavos = 0n
  for (const item of orden.items) {
    const result = await db.query(`SELECT s.cantidad,p.precio_venta,
      CASE WHEN p.precio_venta IS NULL THEN NULL ELSE round(p.precio_venta * (100-COALESCE((
        SELECT max(d.porcentaje) FROM public.descuento d WHERE d.codigo_producto=p.codigo_producto
          AND CURRENT_DATE BETWEEN d.fecha_inicio AND d.fecha_fin AND d.porcentaje BETWEEN 0 AND 100
      ),0)))::bigint::text END AS centavos,
      (s.id_lote IS NOT NULL AND (l.codigo_producto IS DISTINCT FROM p.codigo_producto OR l.fecha_vencimiento < CURRENT_DATE)) AS lote_invalido
      FROM public.stock s JOIN public.producto p USING(codigo_producto)
      LEFT JOIN public.lote l ON l.id_lote=s.id_lote
      WHERE s.id_farmacia=$1 AND s.codigo_producto=$2 FOR UPDATE OF s FOR SHARE OF p`,[orden.farmacia,item.codigo_producto])
    const linea = result.rows[0]
    if (!linea || linea.cantidad == null || linea.cantidad < item.cantidad || linea.centavos === null ||
        Number(linea.precio_venta) <= 0 || linea.lote_invalido) throw new ConflictException()
    totalCentavos += BigInt(linea.centavos) * BigInt(item.cantidad)
    if (totalCentavos > 9999999999n) throw new BadRequestException()
    lineas.push({...item, centavos:linea.centavos})
  }
  const id = (await db.query(`INSERT INTO public.venta(id_venta,id_cliente,id_empleado,fecha_hora,total_cobrado)
    VALUES(nextval('practica_api.identificador'),$1,$2,CURRENT_DATE,$3::numeric/100) RETURNING id_venta`,
    [orden.cliente,orden.empleado,totalCentavos.toString()])).rows[0].id_venta
  for (const item of lineas) {
    await db.query(`INSERT INTO public.detalle_venta(id_detalle,codigo_producto,id_venta,cantidad,precio_historico)
      VALUES(nextval('practica_api.identificador'),$1,$2,$3,$4::numeric/100)`,[item.codigo_producto,id,item.cantidad,item.centavos])
    const updated = await db.query('UPDATE public.stock SET cantidad=cantidad-$1 WHERE id_farmacia=$2 AND codigo_producto=$3 AND cantidad >= $1',
      [item.cantidad,orden.farmacia,item.codigo_producto])
    if (updated.rowCount !== 1) throw new ConflictException()
  }
  await db.query('INSERT INTO practica_api.operacion_venta(operacion,actor,contenido,venta) VALUES($1,$2,$3,$4)',[key,access.sub,body,id])
  return detalle(db,access,id)
}
