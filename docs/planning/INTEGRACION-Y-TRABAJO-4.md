# VitaFarma · Decisiones de integración y cobertura del Trabajo 4

El 18/11/2026 el propietario aceptó la portada, el inventario por sucursal y el dashboard con las interfaces académicas locales. El [informe de la Parte II](../trabajo-4/README.md) conserva las pantallas y la verificación SQL. El [acta de la release](CIERRE-RELEASE-2026.md) identifica los casos ejecutados y el estado del acceso académico remoto.

## Punto de partida del 18 de noviembre

La revisión de partida es `2a39370`, que incorpora el login del PR #1. El usuario autorizó implementar los sprints, conectar servicios, hacer commits y fusionar a la rama principal. Se conserva el monolito y su lockfile. La base de DevOps está publicada en `main`. El frontend autentica con Supabase y ambos inventarios, el del navegador y el de NestJS, aún usan conjuntos de demostración independientes en esa revisión.

La preparación del entorno local, la UI y los contratos ocupan áreas distintas. Los materiales locales del Trabajo 3 pertenecen a otra entrega. Su presencia no acredita qué triggers están instalados en la BD académica. Las fechas originales de G1 y G2 ya pasaron. Desde el 18 hasta el 27/11 quedan ocho jornadas planificables, 48 h brutas. La aceptación de cada incremento se registra con su fecha efectiva.

## S1-02 · Qué se puede leer

| Fuente | Identificador verificable | Uso |
|---|---|---|
| [Instantánea de Supabase](../schema-supabase-actual.sql) | Git blob `cde0c81fd8b279bd6db852e2e89ebb3fb34a6e31` | 27 tablas de la copia histórica. Última comparación documental con el remoto el 25/10/2026. |
| [Script académico](../../Scripts/farmacia_crebas.sql) | Git blob `8c28b83822b972a4ce83fdb5c4efe8aac50b6159` | Modelo presentado y relaciones de referencia. |
| [Análisis del esquema y del llenado](../DB-CONTEXT.md) | Revisión de partida `2a39370` | El llenado incluye operaciones de preparación. Se prepara un dataset mínimo independiente en local. |

| Pantalla o indicador | Clave y lectura | Caso de aceptación |
|---|---|---|
| Portada pública | Contenido estático. Enlace a `/equipo/entrar`. | Abre sin sesión y con Auth/API fuera de servicio. |
| Acceso del personal | Supabase Auth emite la identidad. NestJS debe resolver por `sub` las sucursales permitidas en una fuente administrada del servidor. | Identidad sin asignación no accede. El correo ni la metadata editable confieren permisos. |
| Selector de sucursal | `farmacia.id_farmacia` con nombre y `id_ciudad` opcional, limitado a la asignación. | Una identidad asignada a una sucursal solo puede seleccionarla y consultarla. |
| Catálogo e inventario | `producto.codigo_producto` con nombre, presentación y categoría opcional. La farmacia elegida determina el saldo mediante `stock(id_farmacia,codigo_producto)`. | El catálogo conserva productos sin saldo registrado en la farmacia seleccionada. El límite de la página es 8. |
| Detalle | Producto, categoría, medicamento opcional, saldo y lote asociado. La especialización medicamento comparte la PK con producto. | Un producto existente sin stock tiene `stock: null`. Distinguir cero, cantidad nula y lote ausente. Si el lote corresponde a otro producto, conservar la anomalía para revisión y excluirlo del cómputo de vencidos. |
| Registros de existencias | Contar las claves de `stock` del conjunto filtrado antes de paginar. | La cantidad de productos del listado puede exceder el número de filas de stock. |
| Registros con cero unidades | Contar filas de stock con `cantidad = 0`. | Un nulo y un producto sin fila de stock se excluyen. |
| Registros con lote vencido | Contar filas con lote asociado al mismo producto, con fecha conocida anterior a la fecha civil de consulta en Bolivia. | Un vencimiento de hoy queda fuera. Los joins con composición o proveedores no deben multiplicar saldos. |
| Proveedores e historial comercial (P1) | `producto_proveedor` es un puente. La sucursal de una venta solo se infiere del empleado actualmente vinculado. | Exigir alcance demostrable. Una reasignación del empleado puede cambiar la atribución histórica. |

Los campos DATE conservan fecha civil. Ni el modelo ni los datos de ejemplo fijan un umbral de «stock bajo». El navegador no debe recibir contraseñas del modelo académico, identidad de pacientes ni salarios en consultas de inventario. La verificación de identidad remota del 18/11 se limitó a obtener el juego de claves públicas de firma del proyecto vinculado (HTTP 200, una clave). La lectura remota de filas y los permisos SQL efectivos siguen pendientes.

## S1-03 · Contratos que requieren coordinación

Se propone usar el driver `pg` en NestJS y conservar `@supabase/supabase-js` en React. Las consultas remotas necesitan un rol dedicado de lectura, TLS verificado y tiempos máximos de consulta. La integración habitual usa credenciales de servidor. La API pública de datos de Supabase y los permisos de la BD académica quedan bajo administración del propietario.

| Cambio propuesto | Consumidores y verificación |
|---|---|
| Hacer asíncrona y acotada por sucursal la lectura de metadatos, listado paginado y detalle. | Puerto backend `InventoryReadRepository`, adaptador demo, `InventoryQueries`, controlador, parser, módulo y pruebas `inventory`/`http`. Mantener las rutas actuales, página de 8 y orden estable con desempate por PK. Probar filtros y totales antes de paginar. |
| Adaptador HTTP de inventario, con token vigente y cancelación. | Puerto frontend, repositorio de pruebas, composición en `app/repositories`, loaders de metadatos/listado/detalle, router, AppShell e InventoryPage/Detail. Filtros, tabla y resumen reciben DTOs resueltos. Actualizar pruebas de inventario, acceso y visuales. |
| Autenticación y autorización de servidor. | Validar firma, emisor, audiencia y caducidad. Proponer perfiles de consulta y responsable con IDs explícitos, desconocidos denegados y permisos P1 separados. Devolver 401 por sesión inválida, 403 por falta de asignación y respuesta uniforme ante detalle fuera de alcance. Probar que un cambio de cuenta no reutiliza datos de la anterior. |
| Fallos de red y acceso a datos. | Una caída de Auth o PostgreSQL debe dejar un estado recuperable, sin conmutación a la demo. Comprobar listado, detalle, metadatos, totales e indicadores con cuentas de dos alcances. |

## S1-06 · Decisión de portada pública

Las tres composiciones usan Inter e Inter Tight ya instaladas, el verde `#0B4937` del acceso, texto `#19362D`, superficies `#FFFFFF` y fondo `#F6F8F5`. Se propone mantener un único destino de acceso, el login existente. La aprobación previa de «Mesa de control» corresponde al inventario.

| Composición | Recorrido propuesto | Movimiento, versión móvil y riesgo |
|---|---|---|
| A · Mostrador VitaFarma | Marca → propósito de la red → botón «Acceso del personal» → breve explicación de la consulta por farmacia. La acción principal queda visible en la primera pantalla. | Feedback del botón de 120 ms. En 360 px, propósito y acceso preceden al detalle. La fotografía, en caso de usarse, debe conservar espacio suficiente para el texto. |
| B · Guía de la farmacia | Cabecera con índice → presentación institucional → alcance del inventario → acceso al equipo. Composición editorial de lectura vertical. | Enlaces de sección con foco visible y desplazamiento nativo. En móvil, índice compacto en línea. Mantener el acceso alcanzable sin recorrer todo el contenido. |
| C · Puerta de personal | Columna de identificación y acceso, junto a una segunda columna que explica sucursal → consulta → detalle. | Recorrido gráfico estático. En móvil, el acceso pasa arriba y el recorrido debajo. Las etapas deben distinguirse de enlaces interactivos. |

Para jerarquía y composición pública se revisaron las fichas de [UGEM](https://dribbble.com/shots/15688426-Pharmacy-App-Landing-Page-Animation) y [Nixtio](https://dribbble.com/shots/24672165-Pharmacy-Website-Animation-Design). Para el feedback de cambios se consultó el [ejemplo de Motion](https://motion.dev/examples/react-layout-animation). Se usarán foco inmediato y estilos estáticos con movimiento reducido. Capturar a 360, 768 y 1280 px y probar teclado, Auth desactivado y ausencia de consultas internas al entrar en `/`.

El propietario eligió la opción A, entregada y aceptada el 18/11. Esta composición da prioridad a la tarea disponible. El alcance propuesto comprende el módulo `frontend/src/modules/landing`, `app/router.tsx`, `main.tsx`, `app/AccessRoutes.tsx` y las pruebas de portada, inventario y configuración afectadas. Acotar el proveedor de sesión a las rutas del personal permite abrir la portada incluso cuando Auth está caído.

## Parte II · Interfaces de la asignatura

La página 3 del *Trabajo 4 – Investigación – Bases de Datos Modernas e Interfaces* asigna 20 de 40 puntos a las interfaces. La defensa indicada es el 2 o 3 de diciembre de 2026 según el turno del grupo. La Parte I es una investigación independiente. La integración de noviembre reutiliza el modelo relacional de la farmacia.

| Requisito de la Parte II | Tablas relacionadas | Qué demostrar con datos de práctica |
|---|---|---|
| Gestionar farmacias y empleados | farmacia, ciudad, empleado, cargo | Alta y consulta, modificación y eliminación cuando proceda. Demostrar el comportamiento ante referencias existentes. |
| Registrar productos y medicamentos y consultar existencias por farmacia | producto, categoria, medicamento, laboratorio, stock, lote | Elegir farmacia, consultar existencias y distinguir ausencia de saldo. Para la parte de escritura, registrar producto y especialización coherentes. |
| Seleccionar productos, registrar una venta y consultar detalles | venta, detalle_venta, producto, stock, empleado | Encabezado y líneas atómicos, cantidades e importes coherentes; la sucursal se determina en el servidor. Verificar qué descuenta stock antes de ejecutar una venta para evitar un débito doble. |
| Administrar clientes, descuentos, planillas salariales y usuarios | cliente, descuento, producto, salario, empleado, usuario, rol | Usar identidades y salarios sintéticos; separar el acceso del sistema del registro académico de usuario. Evitar que las capturas expongan credenciales. |

Para el informe, adjuntar por pantalla su propósito, operación demostrada, captura de la interfaz y captura de las filas de prueba pertinentes antes/después de la operación. Incluir la revisión de Git y el dataset que permitan repetirla. La aceptación de noviembre y la defensa de diciembre son hitos distintos. El propietario autorizó las operaciones de escritura de la Parte II exclusivamente en PostgreSQL local de práctica. La conexión académica queda preparada para una credencial de lectura dedicada, pendiente de disponibilidad.
