# VitaFarma · Backend modular

NestJS + TypeScript. Un proceso, nueve módulos y un único esquema académico previsto.
La base actual **solo sirve consultas sintéticas en local**; no carga `.env` ni se conecta a Supabase.

Desde la raíz:

```sh
npm ci
npm run dev:backend
```

Por defecto escucha en `127.0.0.1:3000`. La variable opcional `PORT` acepta un entero
entre 1 y 65535; el host permanece local. Para ejecutar el compilado:

```sh
npm run build
npm run start --workspace @vitafarma/backend
```

## API demo

Prefijo `/api/v1`. Todas las respuestas llevan `X-VitaFarma-Data: synthetic-demo`,
`Cache-Control: no-store` y `X-Content-Type-Options: nosniff`.

| Método y ruta | Resultado |
| --- | --- |
| `GET /health` | El proceso en ejecución devuelve HTTP 200 con `status: ok`, `mode: demo` y `database: disconnected`. |
| `GET /ready` | Comprueba si la API puede leer su base de datos. En el modo demo devuelve HTTP 503 con código `UNAVAILABLE`. |
| `GET /inventory/metadata` | Sucursal, categoría, ciudad y fecha de referencia demo |
| `GET /inventory` | Filas, paginación y resumen del conjunto filtrado |
| `GET /inventory/:idFarmacia/:codigoProducto` | Detalle por clave compuesta o 404 |

Al integrar PostgreSQL, el módulo que configura la conexión podrá proporcionar
`ReadDatabaseProbe`. Su método `check()` debe verificar el acceso con la conexión
lectora de la aplicación y un tiempo de espera acotado. Cada petición a `/ready`
ejecuta la comprobación. Una lectura exitosa devuelve HTTP 200 con
`{"status":"ready"}`. Una falla devuelve HTTP 503 con un mensaje genérico.

Consulta de ejemplo:
<http://127.0.0.1:3000/api/v1/inventory?farmacia=1&estado=sin-cantidad&orden=codigo-asc>

Parámetros: `farmacia`, `q` (hasta 100 caracteres), `categoria`, `estado`, `orden`,
`pagina`. Identificadores y página son enteros positivos seguros. Opciones inválidas,
parámetros repetidos o desconocidos devuelven 400. Una página fuera del resultado se
ajusta a la última; un resultado vacío conserva una página válida.

Estados: `todos`, `con-existencias`, `sin-unidades`, `sin-cantidad`, `sin-registro`,
`sin-lote`, `vencido`. Órdenes: `nombre-asc`, `nombre-desc`, `codigo-asc`, `cantidad-desc`,
`vencimiento-asc`. El resumen se calcula antes de paginar.

La API usa cuatro productos demo (`4001`–`4004`), una sucursal (`1`) y fecha fija
`2026-10-25`. Representan cantidad positiva, cero, nula y ausencia de stock. Es un
corpus independiente del frontend: no esperar encontrar aquí sus códigos `1001`–`1024`.

Los errores siguen `{ statusCode, code, message }` y no devuelven trazas o excepciones
internas. No existen endpoints de escritura ni endpoints de los módulos pendientes.
No se configura autenticación, CORS o permisos de datos reales.

## Extensión y pruebas

La composición está en `src/app.module.ts`. Inventario demuestra dominio, aplicación,
puerto de lectura, adaptador demo y presentación. Su `public.ts` exporta el módulo y
las consultas; no el repositorio.

```sh
npm run test:architecture
npm run test:backend
```

Consultar [Arquitectura](../docs/architecture/ARCHITECTURE.md),
[Módulos](../docs/architecture/MODULES.md) y [Desarrollo](../docs/architecture/DEVELOPMENT.md).
