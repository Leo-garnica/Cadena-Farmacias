# Entorno local de práctica

La práctica reproduce las relaciones de la base académica con PostgreSQL 17 y datos ficticios persistentes. Supabase Auth emite las identidades que utiliza la aplicación. Ambos servicios comparten una red de Docker y publican sus puertos en la propia máquina.

## Arranque

Requiere Node.js 22.12 o superior, Docker con contenedores Linux y Compose v2 con soporte para `--wait`. Desde la raíz del repositorio, ejecuta:

```sh
npm ci
npm run dev:practica
```

Para abrir la interfaz y la API en la copia de gestión, usa `npm run dev:gestion` en lugar de `npm run dev:practica`. Los dos modos utilizan los mismos puertos de aplicación. Detén primero el modo anterior con Ctrl+C.

El primer arranque descarga las imágenes fijadas por hash, crea el volumen `vitafarma-practica_datos`, carga las tablas y da de alta tres cuentas locales. Las siguientes ejecuciones reutilizan el volumen y las credenciales. El programa comprueba permisos, recuentos, firma ES256, identidad y cierre de sesión. Si falla la comprobación, termina con un código de error.

| Servicio | Dirección accesible desde la máquina | Uso |
| --- | --- | --- |
| PostgreSQL de consulta | `127.0.0.1:55432/vitafarma_practica` | El lector `vf_lector` permite verificar la semilla original. |
| PostgreSQL de gestión | `127.0.0.1:55432/vitafarma_gestion` | `vf_lector` lee inventario e indicadores. `vf_gestion` efectúa las operaciones académicas dentro de esa misma base. |
| Supabase Auth, detrás de `gateway` | `http://127.0.0.1:55433` | La web inicia sesión con la clave pública generada. |
| Claves públicas de firma | `http://127.0.0.1:55433/auth/v1/.well-known/jwks.json` | El verificador de la práctica comprueba firma, emisor `http://127.0.0.1:55433/auth/v1` y audiencia `authenticated`. |

### Configuración de web y API

Los comandos `dev:practica` y `dev:gestion` cargan automáticamente las variables de cada proceso y conservan las claves en la carpeta personal `.vitafarma/practica-v1`. Vite recibe la URL y la clave pública de Auth de `frontend.env.local`. NestJS usa `backend.env.local` para consulta, o `backend.gestion.env.local` para gestión. Este último apunta a la base independiente `vitafarma_gestion` y asigna un escritor distinto del lector.

La web está en `http://127.0.0.1:5173/`. El estado de la API está en `http://127.0.0.1:3000/api/v1/health` y su disponibilidad para lecturas en `/api/v1/ready`. El comando `node local/practica.mjs verify` comprueba directamente PostgreSQL de control y las identidades de Auth. Para iniciar solo los servicios usa `node local/practica.mjs up` y, si necesitas la copia de escritura, `node local/practica.mjs gestion`. [Detalle del modo de gestión](../../backend/src/modules/sales/README.md)

Para una terminal de backend individual en PowerShell puedes cargar las variables del archivo elegido sin mostrarlas. Conserva la configuración de frontend en una terminal independiente.

```powershell
$archivoPractica = Join-Path $env:USERPROFILE '.vitafarma/practica-v1/backend.env.local'
foreach ($linea in [IO.File]::ReadAllLines($archivoPractica)) {
  if ($linea.Trim()) {
    $nombre, $valor = $linea -split '=', 2
    [Environment]::SetEnvironmentVariable($nombre, $valor.Trim("'"), 'Process')
  }
}
npm.cmd run dev:backend
```

| Correo de prueba | Perfil en el servidor | Sucursales |
| --- | --- | --- |
| `operador@vitafarma.test` | Consulta | 1 |
| `supervisor@vitafarma.test` | Responsable | 1 y 2. Gestión añade la preasignación del ID 3 para el ejercicio de alta. |
| `sinacceso@vitafarma.test` | Sin asignación | Ninguna |

Las contraseñas aleatorias para ingresar desde el navegador están en el archivo privado `cuentas.json`. Las tres identidades se crean en el esquema local de Auth. El archivo del servidor asigna permisos por UUID. La tercera identidad permite comprobar la denegación de acceso en la API con una sesión válida.

## Origen y alcance de la copia

`local/practica.mjs` comprueba el SHA-256 del [snapshot académico](../schema-supabase-actual.sql) normalizando finales de línea a LF. Se espera `4eb2598810690437afb9c05a66bf9d4350cffd56ffb08118ff56b686a2437f30`. Extrae 140 declaraciones de tablas, índices y restricciones, incluidas las 27 tablas, sus claves primarias y sus claves foráneas. Un hash diferente interrumpe la preparación para revisar la nueva versión. Las rutinas y los permisos de la instalación remota quedan fuera de la copia. Los datos se crean con el [dataset VF-PRACTICA-1](../../local/datos.sql).

La cuenta de inicialización es distinta de la cuenta de Auth y del lector de NestJS. El lector tiene conexión a esta base y lectura del catálogo, categorías, ciudades, farmacias, lotes, existencias y medicamentos. La prueba comprueba privilegios efectivos y membresías. La creación de identidades se realiza con la API administrativa local de GoTrue al preparar la práctica; el autorregistro público está desactivado.

## Recuentos de referencia

En el dataset VF-PRACTICA-1 de control, el catálogo tiene 12 productos, tres categorías y dos sucursales. El tamaño de página previsto es ocho. La semilla incluye un producto con dos lotes en distintas sucursales y productos sin especialización en medicamento.

| Sucursal | Productos del catálogo | Filas de stock | Unidades conocidas | Filas con cero | Filas con cantidad nula | Productos sin fila |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1, Centro | 12 | 10 | 36 | 2 | 1 | 2 |
| 2, Norte | 12 | 3 | 26 | 1 | 0 | 9 |

En Centro, el producto 101 tiene ocho unidades de un lote ya vencido y en Norte conserva 24 de otro lote. En Centro, el 102 vence el día de creación de la práctica y tiene saldo cero, el 103 tiene fila con cantidad nula y sin lote, y el 112 carece de fila. Para contrastar fechas en un volumen antiguo, toma como fecha de referencia el vencimiento del lote 3; al día siguiente ese lote también pasa a vencido en una pantalla que consulte la fecha actual. Los recuentos de la tabla se verifican contra PostgreSQL. [Comprobación independiente](../../local/verificar.sql)

## Parada y recuperación

```sh
node local/practica.mjs stop
node local/practica.mjs up
```

Detén primero la aplicación con Ctrl+C. La parada de servicios conserva el volumen y las identidades. Ante una conexión rechazada, comprueba que Docker Desktop esté iniciado con un motor local y que los puertos 55432 y 55433 estén disponibles. Puedes revisar `docker ps -a --filter label=com.docker.compose.project=vitafarma-practica` y los eventos del servicio afectado en Docker Desktop.

Si cambias de checkout, ejecuta `up` desde la nueva raíz para actualizar los montajes. Si existe el volumen pero se ha perdido la carpeta de claves, recupera esa carpeta desde tu copia privada. Para regenerar desde cero una práctica deliberadamente desechable, detén sus servicios, comprueba el nombre exacto del proyecto en Docker Desktop y elimina únicamente sus contenedores y el volumen `vitafarma-practica_datos` tras confirmar que quieres perder sus datos. Conservando la carpeta de claves, el siguiente `up` rehace los datos con las mismas cuentas. Ningún comando de arranque borra el volumen.

La autenticación usa el formato de claves asimétricas publicado para Supabase autoalojado. [Configuración oficial de claves de Supabase](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys)
