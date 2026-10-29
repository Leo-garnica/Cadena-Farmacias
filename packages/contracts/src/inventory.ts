/** Read-only projections of the verified PostgreSQL schema; DATE stays ISO date-only. */
import type { DateOnly } from './common.js'
export type { DateOnly } from './common.js'
export interface Ciudad { id_ciudad: number; nombre: string | null }
export interface Farmacia {
  id_farmacia: number; id_ciudad: number | null; nombre: string | null
  direccion: string | null; telefono: string | null
}
export interface Categoria { id_categoria: number; nombre: string | null; descripcion: string | null }
export interface Producto {
  codigo_producto: number; id_categoria: number | null; nombre: string | null
  descripcion: string | null; presentacion: string | null
  precio_compra: number | null; precio_venta: number | null
}
export interface Medicamento {
  codigo_producto: number; id_laboratorio: number | null
  fecha_vencimiento: DateOnly | null; accion_terapeutica: string | null
}
export interface Lote {
  id_lote: number; codigo_producto: number | null; codigo_alfanumerico: string | null
  fecha_fabricacion: DateOnly | null; fecha_vencimiento: DateOnly | null
}
export interface Stock {
  id_farmacia: number; codigo_producto: number; id_lote: number | null; cantidad: number | null
}


export type InventoryOrder = 'nombre-asc' | 'nombre-desc' | 'codigo-asc' | 'cantidad-desc' | 'vencimiento-asc'
export type InventoryStatus = 'todos' | 'con-existencias' | 'sin-unidades' | 'sin-cantidad' | 'sin-registro' | 'sin-lote' | 'vencido'
export interface InventoryQuery { farmacia: number; q: string; categoria: number | null; estado: InventoryStatus; orden: InventoryOrder; pagina: number }
export interface InventoryRow {
  producto: Producto; categoria: Categoria | null; farmacia: Farmacia
  stock: Stock | null; lote: Lote | null; medicamento: Medicamento | null
}
export interface InventorySummaryData { registros: number; conExistencias: number; sinUnidades: number; sinCantidad: number; sinRegistro: number; vencidos: number }
export interface InventoryResult {
  query: InventoryQuery; rows: InventoryRow[]; total: number; pageCount: number; pageSize: number; summary: InventorySummaryData
}
export interface InventoryMetadata { farmacias: Farmacia[]; categorias: Categoria[]; ciudades: Ciudad[]; referenceDate: DateOnly }
