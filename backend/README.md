# VitaFarma · API de consulta y gestión de práctica

NestJS ejecuta un monolito con nueve módulos. El inventario y los reportes consultan PostgreSQL a través de una cuenta de lectura. Supabase Auth identifica a cada usuario.

## Arranque local

Desde la raíz, instala las dependencias con `npm ci`. Ejecuta `npm run dev:practica` para consultas o `npm run dev:gestion` para formularios y ventas. Ambos comandos cargan las variables del modo elegido e inician la web y la API. La API escucha en `127.0.0.1:3000`. Para operar el backend por separado, carga únicamente su archivo privado de entorno y usa `npm run dev:backend`. [Entorno local](../docs/architecture/ENTORNO-LOCAL.md)

| Variable de servidor | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión de la cuenta lectora a PostgreSQL. El lector requiere SELECT sobre farmacia, ciudad, categoria, producto, stock, lote y medicamento. La comprobación de permisos descarta lectura de otras tablas públicas y escritura efectiva en ellas. |
| `SUPABASE_URL` | Origen del proyecto Auth, sin ruta. La API obtiene las claves públicas desde `/auth/v1/.well-known/jwks.json`. Los destinos externos requieren HTTPS. |
| `VITAFARMA_ACCESS_MAP` | Objeto JSON administrado en el servidor. Cada clave es el UUID del sujeto verificado. Su valor contiene `perfil` (`consulta` o `responsable`) y `sucursales` (lista explícita de IDs). |
| `VITAFARMA_PRACTICA_WRITE_URL` | Conexión exclusiva al escritor de `vitafarma_gestion` con Auth local. El modo académico remoto utiliza únicamente el lector. |

Una conexión SQL externa requiere TLS con verificación del certificado. Si el emisor usa una CA privada, configúrala en el entorno de Node antes de iniciar el servicio. En la práctica local se utiliza la dirección de loopback. La cuenta lectora dispone de un pool de hasta seis conexiones, espera máxima de conexión de tres segundos y límite de ejecución SQL de cuatro segundos por sentencia. Las lecturas se efectúan en transacciones de solo lectura y snapshot repetible.

## Contrato HTTP

Prefijo `/api/v1`. Las respuestas llevan `Cache-Control: no-store` y `X-Content-Type-Options: nosniff`. El navegador utiliza el proxy del mismo origen de la aplicación. El encabezado `Authorization: Bearer <access_token>` protege todas las rutas salvo los dos indicadores técnicos.

| GET | Respuesta |
| --- | --- |
| `/health` | 200 si el proceso responde. Incluye `status`, `service` y `mode: postgresql`. |
| `/ready` | 200 tras comprobar el rol lector y ejecutar una lectura. Una dependencia sin configurar o caída devuelve 503. |
| `/me` | `sub`, `perfil`, `sucursales` de la identidad verificada y reconocida por el servidor. |
| `/inventory/metadata` | Sucursales autorizadas, ciudades asociadas, categorías y fecha civil de referencia de Bolivia en formato ISO. |
| `/inventory` | `query`, `rows`, `total`, `pageCount`, `pageSize` (8) y `summary`. |
| `/inventory/:idFarmacia/:codigoProducto` | Producto en el catálogo y su saldo en la farmacia autorizada. Producto existente sin saldo contiene `stock: null`. |
| `/reports/inventory` | `farmacia`, `referenceDate`, `registros`, `sinUnidades` y `vencidos`. Comparte alcance y filtros con inventario. |

El listado y el reporte aceptan `farmacia`, `q` (máximo 100 caracteres), `categoria`, `estado`, `orden` y `pagina`. El detalle utiliza la clave compuesta farmacia/producto. Los IDs deben ser enteros positivos del rango de PostgreSQL `integer`. El servidor limita la página a las existentes. Un resultado vacío conserva la página 1.

| Parámetro | Valores |
| --- | --- |
| `estado` | `todos`, `con-registro`, `con-existencias`, `sin-unidades`, `sin-cantidad`, `sin-registro`, `sin-lote`, `vencido` |
| `orden` | `nombre-asc`, `nombre-desc`, `codigo-asc`, `cantidad-desc`, `vencimiento-asc` |

La búsqueda encuentra texto literal en el nombre normalizado o en el código. Los empates se ordenan por código de producto. El total cuenta productos del catálogo tras aplicar los filtros. Los indicadores se calculan sobre todo el conjunto filtrado antes de paginar. `registros` cuenta filas de stock, `sinUnidades` cantidades exactamente cero y `vencidos` lotes del mismo producto cuya fecha es anterior a la fecha civil en `America/La_Paz`. Cuando un stock tiene una referencia a un lote de otro producto, se conserva `stock.id_lote` y el detalle devuelve `lote: null`.

Los errores tienen forma `{ statusCode, code, message }`. El servidor devuelve 400 por parámetros inválidos, 401 por sesión inválida, 403 por perfil sin asignación o acceso a una sucursal ajena, 404 por detalle inexistente o ajeno y 503 por fallos de configuración, conexión, permisos SQL o disponibilidad del proveedor de claves. El correo y la metadata modificable del usuario quedan fuera de las decisiones de autorización. Los tokens válidos se comprueban localmente contra las claves públicas en caché hasta su caducidad.

## Gestión del Trabajo 4

En modo gestión, el responsable dispone de `/api/v1/practica` para mantener ocho recursos y registrar ventas transaccionales en la práctica local. El detalle aplica los descuentos vigentes, guarda los precios históricos y descuenta las cantidades en la misma base que consulta el inventario. [Rutas, alcance y prueba con PostgreSQL](src/modules/sales/README.md)

## Verificación

Desde la raíz, ejecuta `npm run test:architecture` y `npm run test:backend`. Estas pruebas usan un emisor de claves efímero en loopback. Para verificar las consultas reales, con la práctica activa y la API compilada, ejecuta:

```sh
node backend/integration/inventory-practica.mjs
```

El segundo recorrido inicia sesión con tres cuentas de prueba, verifica los permisos por ruta y contrasta listado, detalle e indicadores con una consulta independiente a PostgreSQL. Añade `--rendimiento` para medir 50 solicitudes por operación en grupos de cinco, después del calentamiento. Los datos y contraseñas de la práctica permanecen en la máquina.
