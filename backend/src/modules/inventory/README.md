# Inventario

Inventario consulta las proyecciones de farmacia, catálogo, medicamento, stock y lote mediante su puerto de lectura asíncrono. `inventory.module.ts` compone el repositorio PostgreSQL. El adaptador histórico de `infrastructure/demo` se utiliza en pruebas aisladas.

El listado, el detalle y los contadores limitan las lecturas a las sucursales del perfil. Se preservan la clave compuesta de stock, la ausencia de registro, las cantidades nulas y los lotes válidos por producto. El módulo Reportes consume las consultas públicas de Inventario. [Contrato de la API](../../../README.md)
