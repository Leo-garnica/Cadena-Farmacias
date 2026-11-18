import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import type { PoolClient } from 'pg'
import type { AccessGrant } from '../../access/public.js'
import { recursos, referencias, type Recurso } from './recursos.js'
import { busqueda, datos, entero, offsetValido } from './validacion.js'

function recursoPorClave(clave: string) {
  const result = recursos.find(r => r.clave === clave)
  if (!result) throw new NotFoundException()
  return result
}
const condicion = (r: Recurso) => r.ambito === 'global' ? '$1::integer[] IS NOT NULL' :
  r.ambito === 'farmacia' ? 't.id_farmacia=ANY($1::integer[])' :
    'EXISTS (SELECT FROM public.empleado e WHERE e.id_empleado=t.id_empleado AND e.id_farmacia=ANY($1::integer[]))'

export async function exigirGlobal(db: PoolClient, access: AccessGrant) {
  if ((await db.query('SELECT 1 FROM public.farmacia WHERE NOT(id_farmacia=ANY($1::integer[])) LIMIT 1', [access.sucursales])).rowCount) throw new ForbiddenException()
}
function selectColumn(r: Recurso, clave: string) {
  return r.campos.some(c => c.clave === clave && c.tipo === 'fecha') ? 't.' + clave + '::text AS ' + clave : 't.' + clave
}

export async function listar(db: PoolClient, access: AccessGrant, clave: string, q?: string, offset?: string) {
  const r = recursoPorClave(clave)
  if (r.ambito === 'global') await exigirGlobal(db,access)
  const columnas = r.columnas.map(k => selectColumn(r,k)).join(',')
  const buscables = [r.id, ...r.campos.filter(c => c.tipo === 'texto').map(c => c.clave)]
  const where = ' FROM public.'+r.tabla+' t WHERE '+condicion(r)+' AND ('+buscables.map(k=>'t.'+k+'::text ILIKE $2').join(' OR ')+')'
  const params = [access.sucursales,busqueda(q)]
  const total = (await db.query('SELECT count(*)::int AS n'+where,params)).rows[0].n
  const filas = (await db.query('SELECT '+columnas+where+' ORDER BY t.'+r.id+' LIMIT 30 OFFSET $3',[...params,offsetValido(offset)])).rows
  return {filas,total}
}

export async function opciones(db: PoolClient, access: AccessGrant, clave: string, q?: string, offset?: string, farmacia?: string) {
  const ref = referencias.get(clave)
  if (!ref) throw new NotFoundException()
  if (clave === 'clientes') await exigirGlobal(db,access)
  const sucursales = farmacia == null ? access.sucursales : [entero(farmacia)].filter(id => access.sucursales.includes(id))
  const scoped = clave === 'farmacias' || clave === 'empleados'
  const scope = scoped ? 'id_farmacia=ANY($2::integer[])' : '$2::integer[] IS NOT NULL'
  const where = ' FROM public.'+ref.tabla+' WHERE '+scope+' AND ('+ref.nombre+' ILIKE $1 OR '+ref.id+'::text ILIKE $1)'
  const params = [busqueda(q),sucursales]
  const total = (await db.query('SELECT count(*)::int AS n'+where,params)).rows[0].n
  const filas = (await db.query('SELECT '+ref.id+' AS id,'+ref.nombre+' AS nombre'+where+' ORDER BY '+ref.id+' LIMIT 30 OFFSET $3',[...params,offsetValido(offset)])).rows
  return {filas,total}
}

export async function registrar(db: PoolClient, access: AccessGrant, clave: string, entrada: unknown, id?: number) {
  const r = recursoPorClave(clave)
  const values = datos(r,entrada,id)
  if (r.ambito === 'global') await exigirGlobal(db,access)
  if (r.ambito === 'farmacia' && !access.sucursales.includes(Number(values.id_farmacia ?? id))) throw new ForbiddenException()
  if (r.ambito === 'empleado' && !(await db.query('SELECT FROM public.empleado WHERE id_empleado=$1 AND id_farmacia=ANY($2::integer[]) FOR SHARE',
    [values.id_empleado,access.sucursales])).rowCount) throw new NotFoundException()
  const campos = Object.keys(values)
  const args = Object.values(values)
  const projection = r.columnas.map(k=>selectColumn(r,k)).join(',')
  if (id === undefined) {
    if (!(r.id in values)) {
      campos.unshift(r.id)
      args.unshift((await db.query("SELECT nextval('practica_api.identificador') AS id")).rows[0].id)
    }
    if (r.clave === 'usuarios') { campos.push('contrasena'); args.push('!' + randomBytes(48).toString('hex')) }
    const placeholders = campos.map((_,i)=>'$'+(i+1)).join(',')
    return (await db.query('INSERT INTO public.'+r.tabla+' AS t ('+campos.join(',')+') VALUES ('+placeholders+') RETURNING '+projection,args)).rows[0]
  }
  const target = ' FROM public.'+r.tabla+' t WHERE t.'+r.id+'=$2 AND '+condicion(r)
  const old = await db.query('SELECT '+projection+target+' FOR UPDATE OF t',[access.sucursales,id])
  if (!old.rowCount) throw new NotFoundException()
  // La sucursal histórica de una venta se deduce del empleado en el modelo académico.
  if (r.clave === 'empleados' && old.rows[0].id_farmacia !== values.id_farmacia &&
      (await db.query('SELECT FROM public.venta WHERE id_empleado=$1 LIMIT 1',[id])).rowCount) throw new ConflictException()
  const changes = campos.map((name,i)=>name+'=$'+(i+2)).join(',')
  return (await db.query('UPDATE public.'+r.tabla+' AS t SET '+changes+' WHERE '+r.id+'=$1 RETURNING '+projection,[id,...args])).rows[0]
}

export async function eliminar(db: PoolClient, access: AccessGrant, clave: string, id: number) {
  const r = recursoPorClave(clave)
  if (r.ambito === 'global') await exigirGlobal(db,access)
  const result = await db.query('DELETE FROM public.'+r.tabla+' t WHERE '+condicion(r)+' AND t.'+r.id+'=$2',[access.sucursales,id])
  if (!result.rowCount) throw new NotFoundException()
}
