# Inventario

Propietario lógico de `stock` y `lote`. La BD sigue compartida y no se modifica.

- `domain/`: semántica de nulos, existencias, lote y fecha de referencia; sin framework.
- `application/`: consultas y puerto de lectura; sin NestJS ni SQL.
- `infrastructure/demo/`: adaptador sintético independiente del corpus del frontend.
- `presentation/`: controlador HTTP y validación de parámetros.
- `inventory.module.ts`: composición y selección explícita del adaptador demo.
- `public.ts`: única superficie de integración para otros módulos.

Exporta consultas, nunca el repositorio. Catálogo y sucursales aparecen como proyecciones
de lectura; esto no concede a Inventario propiedad de sus tablas ni capacidad de escribirlas.
El adaptador actual trabaja con un corpus pequeño en memoria. Una integración SQL futura
deberá consultar, filtrar y paginar en la BD, no cargar todo el inventario de producción.

No hay métodos de escritura, conexión a Supabase, alertas de stock mínimo ni inventario
multilote. El vencimiento indica una fecha, no una prohibición automática de venta.
