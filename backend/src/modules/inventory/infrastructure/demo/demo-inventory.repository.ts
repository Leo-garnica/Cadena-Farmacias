import type { Categoria, Farmacia, InventoryMetadata, InventoryRow } from '@vitafarma/contracts/inventory'
import type { InventoryReadRepository } from '../../application/inventory-read.repository.js'

// Small, independent synthetic corpus for the API example; not operational pharmacy data.
const farmacia: Farmacia = { id_farmacia: 1, id_ciudad: 1, nombre: 'Sucursal demo API', direccion: null, telefono: null }
const categoria: Categoria = { id_categoria: 1, nombre: 'Demostración', descripcion: null }
const quantities = [12, 0, null, undefined] as const
const rows: InventoryRow[] = quantities.map((cantidad, index) => {
  const codigo_producto = 4001 + index
  const lote = index < 2 ? {
    id_lote: 5001 + index, codigo_producto, codigo_alfanumerico: `DEMO-${index + 1}`,
    fecha_fabricacion: null, fecha_vencimiento: index === 0 ? '2026-10-24' as const : '2027-01-01' as const,
  } : null
  return {
    farmacia, categoria, medicamento: null, lote,
    producto: { codigo_producto, id_categoria: 1, nombre: `Producto demo ${index + 1}`, descripcion: 'Dato sintético de la API local', presentacion: null, precio_compra: null, precio_venta: null },
    stock: cantidad === undefined ? null : { id_farmacia: 1, codigo_producto, cantidad, id_lote: lote?.id_lote ?? null },
  }
})

export class DemoInventoryRepository implements InventoryReadRepository {
  metadata(): InventoryMetadata {
    return structuredClone({ farmacias: [farmacia], ciudades: [{ id_ciudad: 1, nombre: 'Ciudad demo' }], categorias: [categoria], referenceDate: '2026-10-25' })
  }
  rows(idFarmacia: number): Promise<InventoryRow[]> {
    return Promise.resolve(structuredClone(rows.filter(row => row.farmacia.id_farmacia === idFarmacia)))
  }
  detail(idFarmacia: number, codigoProducto: number): Promise<InventoryRow | null> {
    return Promise.resolve(structuredClone(rows.find(row => row.farmacia.id_farmacia === idFarmacia && row.producto.codigo_producto === codigoProducto) ?? null))
  }
}
