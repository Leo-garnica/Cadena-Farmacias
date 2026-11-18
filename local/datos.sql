-- Datos ficticios VF-PRACTICA-1. Fechas civiles al crear la práctica.
BEGIN;
INSERT INTO public.ciudad (id_ciudad, nombre) VALUES (1, 'Cochabamba'), (2, 'Sucre');
INSERT INTO public.farmacia (id_farmacia, id_ciudad, nombre, direccion) VALUES
  (1, 1, 'Sucursal Centro', 'Dirección de práctica A'),
  (2, 2, 'Sucursal Norte', 'Dirección de práctica B');
INSERT INTO public.categoria (id_categoria, nombre) VALUES
  (1, 'Medicamentos'), (2, 'Insumos'), (3, 'Cuidado personal');

INSERT INTO public.producto (codigo_producto, id_categoria, nombre, descripcion, presentacion, precio_compra, precio_venta)
SELECT codigo, categoria, nombre, 'Producto de práctica académica', presentacion, 2, 5 + codigo % 4
FROM (VALUES
  (101, 1, 'Paracetamol', 'Caja'), (102, 2, 'Gasas estériles', 'Paquete'),
  (103, 3, 'Jabón neutro', 'Barra'), (104, 2, 'Venda elástica', 'Rollo'),
  (105, 2, 'Algodón', 'Bolsa'), (106, 2, 'Guantes', 'Caja'),
  (107, 2, 'Termómetro', 'Unidad'), (108, 2, 'Cinta médica', 'Rollo'),
  (109, 3, 'Crema de manos', 'Tubo'), (110, 2, 'Mascarillas', 'Caja'),
  (111, 3, 'Protector solar', 'Frasco'), (112, 2, 'Apósitos', 'Caja')
) AS productos(codigo, categoria, nombre, presentacion);
INSERT INTO public.laboratorio (id_laboratorio, nombre) VALUES (1, 'Laboratorio de práctica');
INSERT INTO public.medicamento (codigo_producto, id_laboratorio, fecha_vencimiento, accion_terapeutica)
VALUES (101, 1, DATE '2035-09-01', 'Ejemplo académico');

-- Dos lotes del 101 detectan el doble conteo si se une por producto en vez de stock.id_lote.
INSERT INTO public.lote (id_lote, codigo_producto, codigo_alfanumerico, fecha_fabricacion, fecha_vencimiento) VALUES
  (1, 101, 'PRACTICA-VIGENTE', CURRENT_DATE - 90, CURRENT_DATE + 365),
  (2, 101, 'PRACTICA-VENCIDO', CURRENT_DATE - 90, CURRENT_DATE - 1),
  (3, 102, 'PRACTICA-HOY', CURRENT_DATE - 90, CURRENT_DATE);
INSERT INTO public.stock (id_farmacia, codigo_producto, id_lote, cantidad) VALUES
  (1, 101, 2, 8), (1, 102, 3, 0), (1, 103, NULL, NULL), (1, 104, NULL, 7),
  (1, 105, NULL, 2), (1, 106, NULL, 4), (1, 107, NULL, 1), (1, 108, NULL, 9),
  (1, 109, NULL, 0), (1, 110, NULL, 5),
  (2, 101, 1, 24), (2, 103, NULL, 2), (2, 105, NULL, 0);
INSERT INTO public.proveedor (id_proveedor, nombre) VALUES
  (1, 'Proveedor de práctica A'), (2, 'Proveedor de práctica B');
INSERT INTO public.producto_proveedor (codigo_producto, id_proveedor, precio_acordado)
VALUES (101, 1, 2), (102, 1, 2);
COMMIT;
