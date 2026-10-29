import type { DateOnly } from '@vitafarma/contracts/inventory'

export const NOT_RECORDED = 'No registrado'
const numberFormat = new Intl.NumberFormat('es-BO')
const currencyFormat = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' })
const dateFormat = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })

export function formatNumber(value: number) { return numberFormat.format(value) }
export function formatMoney(value: number | null) { return value === null ? NOT_RECORDED : currencyFormat.format(value) }
export function formatDate(value: DateOnly | null) {
  if (value === null) return NOT_RECORDED
  const [year, month, day] = value.split('-').map(Number)
  // Explicit UTC construction AND formatting preserve PostgreSQL DATE in every client timezone.
  return dateFormat.format(new Date(Date.UTC(year, month - 1, day)))
}
export function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim()
}
