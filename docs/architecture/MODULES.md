# Módulos y propiedad de datos

Asignación lógica inicial basada en DB-CONTEXT y el snapshot local. **No cambia la BD**.

| Módulo | Tablas propias | Estado |
| --- | --- | --- |
| `branches` | `ciudad`, `farmacia` | Registrado, pendiente |
| `catalog` | `categoria`, `producto`, `medicamento`, `laboratorio`, `monodroga`, `composicion` | Registrado, pendiente |
| `inventory` | `lote`, `stock` | Consultas demo implementadas |
| `suppliers` | `proveedor`, `producto_proveedor` | Registrado, pendiente |
| `sales` | `cliente`, `venta`, `detalle_venta`, `descuento`, `factura`, `receta_medica` | Registrado, pendiente |
| `staff` | `cargo`, `empleado`, `turno`, `asignacion_turno`, `asignacion_farmaceutico`, `salario` | Registrado, pendiente |
| `access` | `rol`, `usuario` | Registrado; autenticación y permisos pendientes |
| `audit` | `auditoria` | Registrado, pendiente |
| `reports` | Ninguna; proyecciones autorizadas | Registrado, pendiente |

Son **27 tablas, asignadas una vez cada una**. Lecturas relacionadas no conceden
propiedad de escritura. Inventario proyecta productos y sucursales para su consulta;
esto no convierte a Inventario en propietario de `producto` o `farmacia`.

## Relaciones que condicionan el desarrollo

- Producto puede no ser medicamento; composición vincula medicamento y monodroga.
- Stock es farmacia/producto y admite un solo lote asociado opcional; no representa
  un saldo por cada lote disponible.
- Oferta proveedor/producto tiene clave compuesta.
- Usuario requiere empleado y rol; un empleado tiene como máximo un usuario por la
  restricción documentada. No hay vínculo Auth de aplicación implementado.
- Una venta tiene como máximo una factura. Su sucursal se deriva a través del empleado;
  no asumir que eso resuelve atribución histórica tras un traslado.
- Asignación farmacéutica corresponde a una ciudad. Turnos y remuneraciones son subáreas
  del límite Personal y deben respetar permisos distintos.
- `auditoria.fecha_hora` es `DATE` según el snapshot, a pesar de su nombre.

Ventas agrupa inicialmente sus subáreas para mantener coherencia transaccional. La
separación futura de clientes o documentos exige una necesidad concreta, no una tabla
por módulo ni un rediseño del esquema.

## Mapa de pantallas

| Área | Ruta actual / planificación |
| --- | --- |
| Inventario | `/inventario` y `/inventario/:idFarmacia/:codigoProducto`, operativas en modo demo |
| Catálogo, Proveedores, Reportes | Indicadas como Próximamente en la navegación existente |
| Sucursales, Ventas, Personal, Acceso y Auditoría | Pantallas futuras por definir; no se agregan enlaces ficticios |

No se agregan módulos de compras, transferencias, pagos, caja, devoluciones, pacientes
o SIAT: el análisis disponible no acredita su soporte en el modelo actual.

## Orden sugerido de desarrollo

1. Definir acceso real: identidad, permisos y aislamiento por sucursal.
2. Aprobar adaptadores de lectura para Inventario, Sucursales y Catálogo.
3. Implementar Catálogo y Proveedores por casos concretos.
4. Resolver IDs y transacciones antes de altas o ventas.
5. Desarrollar documentos, personal, auditoría y reportes con sus permisos aprobados.

Este orden es planificación; no autoriza operaciones en Supabase.
