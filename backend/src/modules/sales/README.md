# Ventas

Estado: límite registrado en el monolito, funcionalidad pendiente.

Tablas bajo responsabilidad lógica: cliente, venta, detalle_venta, descuento, factura, receta_medica.

Operaciones comerciales y documentos relacionados. Facturación y recetas quedan como subáreas del mismo límite inicial.

Al desarrollar un caso aprobado, usar `domain/`, `application/`, `infrastructure/`
y `presentation/`, como en Inventario. No se crean servicios ni CRUD ficticios para
rellenar carpetas. Exponer integraciones en `public.ts`; no importar repositorios
ni clases internas de otro módulo. La propiedad lógica no altera esquemas o claves.

La reserva de este módulo no habilita escrituras, datos sensibles ni funciones de BD.
