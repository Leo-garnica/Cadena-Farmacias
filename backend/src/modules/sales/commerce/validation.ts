import { createHash } from 'node:crypto'
import { BadRequestException } from '@nestjs/common'
import { entero, objeto, offsetValido } from '../practica/validacion.js'

export const pageSize = 60
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

export function id(value: unknown) {
  return entero(value)
}

export function operationId(value: unknown) {
  if (typeof value !== 'string' || !uuid.test(value)) throw new BadRequestException()
  return value.toLowerCase()
}

export function request(value: unknown) {
  return objeto(value)
}

export function text(value: unknown, max: number) {
  if (typeof value !== 'string') throw new BadRequestException()
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > max || [...trimmed].some(char => {
    const code = char.charCodeAt(0)
    return code < 32 || code === 127
  })) throw new BadRequestException()
  return trimmed
}

export function optionalText(value: unknown, max: number) {
  return value === undefined || value === '' ? null : text(value, max)
}

export function offset(value?: string) {
  return offsetValido(value)
}

export function civilDate(value?: string) {
  if (value === undefined || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value) || value.startsWith('0000')) {
    throw new BadRequestException()
  }
  const date = new Date(value + 'T00:00:00Z')
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new BadRequestException()
  return value
}

export interface Item { codigo: number; cantidad: number }
export interface Line extends Item { nombre: string; precioCentavos: number; lote?: number | null }

export function items(value: unknown): Item[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) throw new BadRequestException()
  const rows = value.map((entry: unknown) => {
    const row = request(entry)
    const cantidad = id(row.cantidad)
    if (cantidad > 1000) throw new BadRequestException()
    return { codigo: id(row.codigo), cantidad }
  }).sort((a, b) => a.codigo - b.codigo)
  if (new Set(rows.map(row => row.codigo)).size !== rows.length) throw new BadRequestException()
  return rows
}

export function expectedAmount(value: unknown) {
  if (value === undefined) return null
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 9_999_999_999) {
    throw new BadRequestException()
  }
  return value
}

export function amount(lines: Line[], delivery = 0) {
  const total = lines.reduce((sum, line) => sum + line.precioCentavos * line.cantidad, delivery)
  if (!Number.isSafeInteger(total) || total > 9_999_999_999) throw new BadRequestException()
  return total
}

export function signedQuantity(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || !value || Math.abs(value) > 1_000_000) {
    throw new BadRequestException()
  }
  return value
}

export function fingerprint(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}
