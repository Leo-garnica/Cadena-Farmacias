# Ventas y operaciones académicas de práctica

El monolito registra en `SalesModule` el controlador de la Parte II del Trabajo 4, bajo `/api/v1/practica`. Centraliza los formularios académicos en la copia de práctica mientras el catálogo y el inventario de consulta conservan sus módulos existentes. El lector del sistema y el escritor local son conexiones separadas.

## Activar y demostrar

Desde la raíz, con Node 22 y Docker local:

```sh
node local/practica.mjs up
node local/practica.mjs gestion
```

El segundo comando crea `vitafarma_gestion` en el mismo PostgreSQL local y carga el modelo académico, el catálogo de prueba, dos empleados y un cliente ficticio. Se puede repetir. Para trabajar con la aplicación completa, ejecuta `npm run dev:gestion` desde la raíz. Prepara los servicios y carga `backend.gestion.env.local` en NestJS y `frontend.env.local` en Vite. [Guía del entorno](../../../../docs/architecture/ENTORNO-LOCAL.md) Las ventas se reflejan en la consulta de inventario de esa misma base. El dataset de control de los sprints está en otra base.

La identidad `supervisor@vitafarma.test` tiene el perfil responsable y las sucursales 1 y 2. En la práctica de gestión también tiene preasignada la sucursal 3 para demostrar su alta. El servicio comprueba la firma del token mediante el guard del monolito, el perfil y el ámbito de la operación. También comprueba el emisor local configurado, las dos conexiones a `127.0.0.1:55432/vitafarma_gestion`, la identidad efectiva del escritor y la marca de instalación. El entorno de consulta conserva su cuenta de solo lectura.

## Contrato de las interfaces

| Ruta relativa | Resultado |
| --- | --- |
| `GET /recursos` | Ocho descripciones de formulario con columnas, PK, tipo, campos obligatorios, referencias y valores enumerados. |
| `GET /opciones/:referencia` | Opciones con `id` y `nombre`. Admite `q`, `offset` y para empleados `farmacia`. |
| `GET /registros/:clave` | Lista paginada de hasta 30 filas y total. Admite `q` y `offset`. |
| `POST /registros/:clave` | Crea la fila a partir de los campos autorizados y devuelve su proyección pública para la sesión. |
| `PUT /registros/:clave/:id` | Reemplaza los campos editables de la fila. La clave primaria es inmutable. |
| `DELETE /registros/:clave/:id` | Devuelve 204 al borrar una fila libre de referencias. Una restricción referencial devuelve 409. |
| `GET /ventas` | Ventas de las sucursales autorizadas, con `offset`, hasta 30 por página. |
| `GET /ventas/:id` | Cabecera y líneas históricas con producto, cantidad y precio unitario aplicado. |
| `POST /ventas` | Cabecera, detalle y stock se confirman en una transacción. Devuelve el detalle de la venta. |

| Formulario | Tablas académicas |
| --- | --- |
| Sucursales | `farmacia`, `ciudad` |
| Empleados | `empleado`, `cargo`, `farmacia` |
| Productos y medicamentos | `producto`, `categoria`, `medicamento`, `laboratorio` |
| Inventario | `stock`, `lote`, `producto`, `farmacia` |
| Clientes y descuentos | `cliente`, `descuento`, `producto` |
| Planillas | `salario`, `empleado` |
| Usuarios académicos | `usuario`, `rol`, `empleado` |
| Registro y detalle de ventas | `venta`, `detalle_venta`, `stock`, `producto`, `lote`, `descuento`, `empleado`, `cliente` |

El mantenimiento del catálogo, clientes y descuentos requiere un responsable con acceso a todas las sucursales existentes porque esos registros son globales. Empleados, planillas y usuarios se delimitan por farmacia. Una planilla calcula su total sumando base, antigüedad y bonos y restando descuentos. Las credenciales de Supabase Auth se gestionan por separado de la ficha de usuario académico. El campo académico obligatorio `contrasena` se genera aleatoriamente y jamás se expone en la API.

El alta de venta utiliza el mismo permiso global que el selector de clientes. Un responsable parcial puede consultar las ventas de las sucursales que tiene asignadas. Una venta necesita un identificador de operación UUID, una farmacia, un empleado de esa farmacia, un cliente y entre 1 y 50 productos distintos con cantidades enteras positivas. Para repetir una solicitud con respuesta incierta se usa el mismo UUID y contenido. Los precios y totales se calculan en el servidor. Como regla de la práctica, se elige el mayor porcentaje individual vigente por producto, se redondea el precio unitario a centavos y se conserva en `precio_historico`. Un lote vencido o que pertenece a otro producto, el stock insuficiente y la cantidad desconocida impiden completar la venta. La sucursal de una venta se deduce del empleado; el sistema protege ese historial al impedir su traslado tras registrar ventas.

La secuencia de claves y el registro de reintentos residen en el esquema **local** `practica_api`. La copia de práctica carece de triggers académicos de venta. Si se detectan triggers activos de usuario en las tablas afectadas, se rechaza vender hasta revisar sus efectos. La práctica conserva las relaciones originales del modelo y jamás ejecuta los scripts académicos de instalación. Las operaciones administrativas de venta posteriores a su confirmación requieren definir las reglas de anulación.

## Prueba de integración

Con la práctica de gestión iniciada y el backend compilado, las siguientes instrucciones comprueban los ocho formularios y las reglas de venta sobre PostgreSQL. Las transacciones de ensayo revierten sus datos y las secuencias pueden avanzar. Las altas usan identificadores libres y las comprobaciones de concurrencia se hacen con dos sesiones. El stock del producto 101 en la sucursal 2 se prepara dentro de una transacción que recupera su valor anterior al finalizar.

```powershell
npm.cmd run build --workspace @vitafarma/backend
node --env-file="$env:USERPROFILE/.vitafarma/practica-v1/backend.gestion.env.local" --test backend/test/practica.integration.mjs
```
