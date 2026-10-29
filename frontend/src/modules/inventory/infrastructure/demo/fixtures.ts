import type { Categoria, Ciudad, DateOnly, Farmacia, Lote, Medicamento, Producto, Stock } from '@vitafarma/contracts/inventory'

export const DEMO_REFERENCE_DATE: DateOnly = '2026-10-25'
export const ciudades: Ciudad[] = [{ id_ciudad: 1, nombre: 'Cochabamba' }]
export const farmacias: Farmacia[] = [
  { id_farmacia: 1, id_ciudad: 1, nombre: 'Central', direccion: 'Av. del Parque 100 (dirección ficticia)', telefono: null },
  { id_farmacia: 2, id_ciudad: 1, nombre: 'Norte', direccion: 'Calle del Jardín 200 (dirección ficticia)', telefono: null },
  { id_farmacia: 3, id_ciudad: 1, nombre: 'Valle', direccion: 'Av. de los Olivos 300 (dirección ficticia)', telefono: null },
]
export const categorias: Categoria[] = [
  'Analgésicos', 'Cuidado respiratorio', 'Salud digestiva', 'Vitaminas y suplementos', 'Cuidado personal', 'Primeros auxilios',
].map((nombre, index) => ({ id_categoria: index + 1, nombre, descripcion: null }))

// Entirely synthetic catalogue: no rows, contacts or prices retrieved from Supabase.
const catalogo: [string, string | null, number, number | null][] = [
  ['Paracetamol 500 mg', 'Caja de 20 tabletas', 1, 12.5],
  ['Ibuprofeno 400 mg', 'Caja de 10 tabletas', 1, 18],
  ['Naproxeno 550 mg', 'Caja de 10 tabletas', 1, 24],
  ['Ácido acetilsalicílico 100 mg', 'Caja de 30 tabletas', 1, 21.5],
  ['Loratadina 10 mg', 'Caja de 10 tabletas', 2, 15],
  ['Cetirizina 10 mg', 'Caja de 10 tabletas', 2, 17],
  ['Ambroxol 15 mg / 5 ml', 'Frasco de 120 ml', 2, 32],
  ['Salbutamol 100 mcg', 'Inhalador de 200 dosis', 2, 65],
  ['Omeprazol 20 mg', 'Caja de 14 cápsulas', 3, 28],
  ['Hidróxido de aluminio y magnesio', 'Suspensión de 200 ml', 3, 34],
  ['Sales de rehidratación oral', 'Caja de 6 sobres', 3, 18],
  ['Simeticona 80 mg', 'Caja de 20 tabletas', 3, 26],
  ['Vitamina C 500 mg', 'Tubo de 20 tabletas efervescentes', 4, 42],
  ['Complejo B', 'Frasco de 30 cápsulas', 4, 48],
  ['Calcio + vitamina D', 'Frasco de 60 tabletas', 4, 76],
  ['Multivitamínico con minerales y zinc', 'Frasco de 60 cápsulas', 4, 89],
  ['Protector solar facial FPS 50+', 'Tubo de 50 ml', 5, 95],
  ['Crema hidratante para piel sensible', 'Frasco de 250 ml', 5, 58],
  ['Jabón neutro', 'Barra de 100 g', 5, 12],
  ['Cepillo dental suave', 'Unidad', 5, 16],
  ['Gasas estériles', 'Paquete de 10 unidades', 6, 14],
  ['Alcohol 70 %', 'Frasco de 250 ml', 6, 19],
  ['Venda elástica de compresión de 10 cm', 'Rollo de 4,5 m', 6, 22],
  ['Termómetro digital', null, 6, null],
]
export const productos: Producto[] = catalogo.map(([nombre, presentacion, id_categoria, precio_venta], index) => ({
  codigo_producto: 1001 + index, nombre, presentacion, id_categoria, precio_venta,
  precio_compra: precio_venta === null ? null : Math.round(precio_venta * 0.65 * 100) / 100,
  descripcion: index === 23 ? null : 'Producto de demostración para consultar existencias y presentación.',
}))
export const medicamentos: Medicamento[] = productos.slice(0, 12).map(({ codigo_producto }) => ({
  codigo_producto, id_laboratorio: null, fecha_vencimiento: null, accion_terapeutica: null,
}))
const vencimientos: (DateOnly | null)[] = ['2026-09-30', '2027-06-30', null, '2026-10-25', '2028-03-31', '2027-12-31']
export const lotes: Lote[] = productos.map(({ codigo_producto }, index) => ({
  id_lote: 2001 + index, codigo_producto, codigo_alfanumerico: `VF-26-${String(index + 1).padStart(3, '0')}`,
  fecha_fabricacion: index === 23 ? null : '2025-06-15', fecha_vencimiento: vencimientos[index % 6],
}))
const cantidades = [128, 0, null, 84, 32, 56, 0, 18, 94, 42, null, 65, 28, 120, 6, 0]
// 16 distinct stock keys per branch = 48 rows. The remaining 8 products per branch have NO row.
export const existencias: Stock[] = farmacias.flatMap((farmacia, branchIndex) =>
  cantidades.map((cantidad, index) => {
    const productIndex = (branchIndex * 8 + index) % productos.length
    return {
      id_farmacia: farmacia.id_farmacia,
      codigo_producto: productos[productIndex].codigo_producto,
      id_lote: index % 5 === 2 ? null : lotes[productIndex].id_lote,
      cantidad: cantidad === null || cantidad === 0 ? cantidad : cantidad + branchIndex * 7,
    }
  }),
)
