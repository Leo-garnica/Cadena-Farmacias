# Módulos y propiedad de datos

La aplicación registra nueve módulos NestJS. La propiedad del modelo académico sigue la distribución de las 27 tablas del snapshot.

| Módulo | Tablas del dominio | Uso en esta entrega |
| --- | --- | --- |
| `branches` | `ciudad`, `farmacia` | Proyecciones para el selector de sucursales y el inventario. Formulario de sucursal en la práctica. |
| `catalog` | `categoria`, `producto`, `medicamento`, `laboratorio`, `monodroga`, `composicion` | Catálogo para inventario y formularios de producto y medicamento en la práctica. |
| `inventory` | `lote`, `stock` | Puerto de consulta, repositorio PostgreSQL y controlador de listado, detalle y metadatos. |
| `suppliers` | `proveedor`, `producto_proveedor` | El directorio de proveedores quedó fuera de la entrega de noviembre. |
| `sales` | `cliente`, `venta`, `detalle_venta`, `descuento`, `factura`, `receta_medica` | El controlador local de la Parte II reúne los formularios, las opciones de referencia y las ventas en la copia de gestión. |
| `staff` | `cargo`, `empleado`, `turno`, `asignacion_turno`, `asignacion_farmaceutico`, `salario` | Formularios de empleado y planilla en la práctica. |
| `access` | `rol`, `usuario` | Guard global, mapa de permisos por UUID y perfil del usuario conectado. La práctica tiene además un formulario para la ficha académica. |
| `audit` | `auditoria` | Propiedad del modelo documentada. |
| `reports` | Proyecciones de otros módulos | Indicadores de stock, saldos en cero y vencimiento mediante el puerto de Inventario. |

**Responsabilidad de ejecución.** Los controladores de lectura pertenecen a Inventario y Reportes. La escritura académica está reunida en el área de práctica de Ventas y opera exclusivamente en la base local de gestión. Esta coordinación permite confirmar cabecera, detalles y descuento de stock en una transacción. [Contrato de práctica](../../backend/src/modules/sales/README.md)

## Relaciones que condicionan los recorridos

- La clave de stock es farmacia/producto, con un único lote asociado opcional. Un mismo producto puede tener distinta cantidad y distinto lote en cada sucursal.
- Un producto puede carecer de la especialización medicamento. La composición vincula medicamento y monodroga.
- La oferta proveedor/producto tiene clave compuesta. El directorio e historial comercial general se retiraron del MVP de noviembre.
- La ficha académica de usuario requiere empleado y rol. El login de la aplicación utiliza una identidad de Supabase Auth con asignación explícita en el servidor.
- La venta obtiene la sucursal a través del empleado. La práctica impide trasladar empleados que ya tienen ventas. El detalle conserva el precio histórico cobrado.
- La asignación farmacéutica corresponde a una ciudad. Turnos y remuneraciones forman parte de Personal.
- `auditoria.fecha_hora` es `DATE` según el snapshot académico.

## Mapa de pantallas

| Área | Ruta | Acceso |
| --- | --- | --- |
| Portada y acceso | `/`, `/equipo/entrar` | Público |
| Inventario y lote | `/inventario`, `/inventario/:idFarmacia/:codigoProducto` | Cuenta con sucursal asignada |
| Indicadores | `/indicadores` | Cuenta con sucursal asignada |
| Formularios académicos | `/practica/:recurso` | Responsable en la práctica de gestión. El ámbito del recurso delimita los datos. |
| Ventas de práctica | `/practica/ventas` | Responsable en la práctica de gestión. Las altas requieren alcance para el catálogo global de clientes. |
