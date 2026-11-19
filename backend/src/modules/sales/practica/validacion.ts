import { BadRequestException } from '@nestjs/common'
import type { Recurso } from './recursos.js'

const invalid = (): never => { throw new BadRequestException('Datos de práctica inválidos') }
export const entero = (valor: unknown): number => {
  if ((typeof valor !== 'number' && typeof valor !== 'string') || !/^\d{1,10}$/u.test(String(valor))) return invalid()
  const id = Number(valor)
  return id >= 1 && id <= 2147483647 ? id : invalid()
}
export const offsetValido = (valor?: string) => valor == null || valor === '0' ? 0 : entero(valor)
export const busqueda = (valor?: string) => {
  if (valor != null && (typeof valor !== 'string' || valor.length > 100)) return invalid()
  return '%' + (valor ?? '').trim().replace(/[\\%_]/gu,'\\$&') + '%'
}
export function objeto(valor: unknown): Record<string, unknown> {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return invalid()
  return valor as Record<string, unknown>
}
export function datos(recurso: Recurso, entrada: unknown, id?: number) {
  const body = objeto(entrada)
  const campos = recurso.campos
  if (Object.keys(body).some(key => !campos.some(c => c.clave === key))) return invalid()
  const values: Record<string, string | number | null> = {}
  for (const campo of campos) {
    const valor = body[campo.clave]
    if (id !== undefined && campo.soloAlta) {
      if (valor != null && entero(valor) !== id) return invalid()
      continue
    }
    if (valor == null || valor === '') {
      if (campo.requerido) return invalid()
      values[campo.clave] = null
    } else if (campo.tipo === 'entero' || campo.referencia) {
      values[campo.clave] = entero(valor)
    } else if (campo.tipo === 'importe') {
      if ((typeof valor !== 'string' && typeof valor !== 'number') || !/^\d{1,8}(\.\d{1,2})?$/u.test(String(valor)) ||
          Number(valor) > (campo.max ?? 99999999.99)) return invalid()
      values[campo.clave] = String(valor)
    } else {
      if (typeof valor !== 'string' || valor.trim().length === 0 || valor.length > (campo.max ?? 100) || valor.includes('\0')) return invalid()
      if (campo.tipo === 'fecha' && (!/^\d{4}-\d{2}-\d{2}$/u.test(valor) || !Number.isFinite(Date.parse(valor)) ||
          new Date(valor + 'T00:00:00Z').toISOString().slice(0,10) !== valor)) return invalid()
      if (campo.opciones && !campo.opciones.includes(valor)) return invalid()
      values[campo.clave] = valor.trim()
    }
  }
  if (recurso.clave === 'productos' && Number(values.precio_venta) <= 0) return invalid()
  if (recurso.clave === 'descuentos' && String(values.fecha_inicio) > String(values.fecha_fin)) return invalid()
  if (recurso.clave === 'empleados' && values.fecha_nacimiento && values.fecha_ingreso && values.fecha_nacimiento > values.fecha_ingreso) return invalid()
  if (recurso.clave === 'clientes' && values.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(String(values.correo))) return invalid()
  if (recurso.clave === 'planillas') {
    if (values.fecha_cobro && String(values.fecha_cobro) < String(values.fecha_elaboracion)) return invalid()
    const cents = (key: string) => Math.round(Number(values[key]) * 100)
    const total = cents('sueldo_base') + cents('monto_antiguedad') + cents('bonos') - cents('descuentos')
    if (total < 0 || total > 9999999999) return invalid()
    values.total_cobrar = (total / 100).toFixed(2)
  }
  return values
}
