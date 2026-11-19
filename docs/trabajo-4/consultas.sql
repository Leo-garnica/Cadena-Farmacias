-- Evidencias del informe. Destino previsto: vitafarma_gestion local.
BEGIN READ ONLY;

-- farmacias
SELECT f.id_farmacia, f.nombre, f.id_ciudad, c.nombre AS ciudad
FROM public.farmacia AS f JOIN public.ciudad AS c USING (id_ciudad)
WHERE f.id_farmacia = 3;

-- empleados
SELECT e.id_empleado, e.nombre_completo, e.id_farmacia, c.nombre AS cargo
FROM public.empleado AS e JOIN public.cargo AS c USING (id_cargo)
WHERE e.id_empleado = 100011;

-- productos
SELECT p.codigo_producto, p.nombre, c.nombre AS categoria,
       p.precio_compra, p.precio_venta
FROM public.producto AS p JOIN public.categoria AS c USING (id_categoria)
WHERE p.codigo_producto = 100012;

-- medicamentos
SELECT m.codigo_producto, l.nombre AS laboratorio,
       m.fecha_vencimiento, m.accion_terapeutica
FROM public.medicamento AS m JOIN public.laboratorio AS l USING (id_laboratorio)
WHERE m.codigo_producto = 100012;

-- inventario
SELECT s.id_farmacia, f.nombre AS farmacia, s.codigo_producto,
       s.cantidad, l.codigo_alfanumerico AS lote
FROM public.stock AS s JOIN public.farmacia AS f USING (id_farmacia)
LEFT JOIN public.lote AS l ON l.id_lote = s.id_lote AND l.codigo_producto = s.codigo_producto
WHERE s.codigo_producto = 101 AND s.id_farmacia IN (1,2)
ORDER BY s.id_farmacia;

-- clientes
SELECT id_cliente, nombres, apellidos
FROM public.cliente WHERE id_cliente = 100013;

-- descuentos
SELECT id_descuento, codigo_producto, descripcion, porcentaje,
       fecha_inicio, fecha_fin
FROM public.descuento WHERE id_descuento = 100014;

-- planillas
SELECT id_salario, id_empleado, sueldo_base, monto_antiguedad,
       bonos, descuentos, total_cobrar
FROM public.salario WHERE id_salario = 100015;

-- usuarios
SELECT u.id_usuario, u.nombre_usuario, u.id_empleado,
       r.nombre_rol, u.estado
FROM public.usuario AS u JOIN public.rol AS r USING (id_rol)
WHERE u.id_usuario = 100016;

-- stock actual (la misma consulta se ejecutó antes y después del cobro)
SELECT id_farmacia, codigo_producto, cantidad
FROM public.stock WHERE id_farmacia = 2 AND codigo_producto = 101;

-- ventas
SELECT v.id_venta, v.fecha_hora, v.id_cliente, v.total_cobrado,
       d.codigo_producto, d.cantidad, d.precio_historico
FROM public.venta AS v JOIN public.detalle_venta AS d USING (id_venta)
WHERE v.id_venta = 100060
ORDER BY d.id_detalle;

ROLLBACK;
