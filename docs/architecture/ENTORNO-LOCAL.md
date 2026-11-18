# Entorno local de práctica

La práctica reproduce las relaciones de la base académica con PostgreSQL 17 y datos ficticios persistentes. Supabase Auth emite las identidades que utiliza la aplicación. Ambos servicios comparten una red de Docker y publican sus puertos en la propia máquina.

## Arranque

Requiere Node.js 22.12 o superior, Docker con contenedores Linux y Compose v2 con soporte para `--wait`. Desde la raíz del repositorio, ejecuta:

```sh
node local/practica.mjs up
node local/practica.mjs verify
```

El primer arranque descarga las imágenes fijadas por hash, crea el volumen `vitafarma-practica_datos`, carga las tablas y da de alta tres cuentas locales. Las siguientes ejecuciones reutilizan el volumen y las credenciales. El programa comprueba permisos, recuentos, firma ES256, identidad y cierre de sesión. Si falla la comprobación, termina con un código de error.

| Servicio | Dirección accesible desde la máquina | Uso |
| --- | --- | --- |
| PostgreSQL, servicio `db` | `127.0.0.1:55432`, base `vitafarma_practica` | Cuenta `vf_lector` preparada para el adaptador PostgreSQL del backend. |
| Supabase Auth, detrás de `gateway` | `http://127.0.0.1:55433` | La web inicia sesión con la clave pública generada. |
| Claves públicas de firma | `http://127.0.0.1:55433/auth/v1/.well-known/jwks.json` | El verificador de la práctica comprueba firma, emisor `http://127.0.0.1:55433/auth/v1` y audiencia `authenticated`. |

La comprobación `verify` se conecta directamente a PostgreSQL y Auth. La conexión entre la interfaz, NestJS y estas mismas fuentes se contrasta por separado en el [Sprint 2](../planning/SPRINT-2.md).

### Conectar la aplicación

El programa genera archivos en `.vitafarma/practica-v1`, dentro de la carpeta personal de quien lo ejecuta. Dos copias del repositorio en esa misma máquina pueden reutilizarlos. La clave de firma y las contraseñas de la práctica se guardan allí. El archivo `frontend.env.local` contiene las dos variables públicas de la web. El archivo `backend.env.local` contiene la conexión del lector, la URL de Auth y el mapa de sucursales por identidad verificada.

Para aplicar los valores en **PowerShell**, abre una terminal para cada proceso. En la terminal de la API usa `backend.env.local`; en la de la web cambia el nombre por `frontend.env.local`. Este bloque carga las variables en el proceso sin imprimir sus valores. Continúa con los comandos de desarrollo del proyecto desde esas terminales. [Guía de desarrollo](DEVELOPMENT.md)

```powershell
$archivoPractica = Join-Path $env:USERPROFILE '.vitafarma/practica-v1/backend.env.local'
foreach ($linea in [IO.File]::ReadAllLines($archivoPractica)) {
  if ($linea.Trim()) {
    $nombre, $valor = $linea -split '=', 2
    [Environment]::SetEnvironmentVariable($nombre, $valor.Trim("'"), 'Process')
  }
}
```

Desde la raíz, inicia el proceso correspondiente en cada terminal, una vez cargado su archivo. La primera compilación de contratos es necesaria en una copia recién instalada.

```powershell
npm run build:contracts
npm run dev:backend
```

```powershell
npm run dev:frontend
```

La web de desarrollo queda en `http://127.0.0.1:5173`. El gateway reconoce ese origen y los puertos de pruebas y previsualización del proyecto.

| Correo de prueba | Perfil en el servidor | Sucursales |
| --- | --- | --- |
| `operador@vitafarma.test` | Consulta | 1 |
| `supervisor@vitafarma.test` | Responsable | 1 y 2 |
| `sinacceso@vitafarma.test` | Sin asignación | Ninguna |

Las contraseñas aleatorias para ingresar desde el navegador están en el archivo privado `cuentas.json`. Las tres identidades se crean en el esquema local de Auth. El archivo del servidor asigna permisos por UUID. La aceptación del bloque de acceso de Sprint 2 exige demostrar que la API deniega el acceso al tercer usuario aunque Auth acepte su contraseña.

## Origen y alcance de la copia

`local/practica.mjs` comprueba el SHA-256 del [snapshot académico](../schema-supabase-actual.sql) normalizando finales de línea a LF. Se espera `4eb2598810690437afb9c05a66bf9d4350cffd56ffb08118ff56b686a2437f30`. Extrae 140 declaraciones de tablas, índices y restricciones, incluidas las 27 tablas, sus claves primarias y sus claves foráneas. Un hash diferente interrumpe la preparación para revisar la nueva versión. Las rutinas y los permisos de la instalación remota quedan fuera de la copia. Los datos se crean con el [dataset VF-PRACTICA-1](../../local/datos.sql).

La cuenta de inicialización es distinta de la cuenta de Auth y del lector previsto para NestJS. El lector tiene conexión a esta base y lectura del catálogo, categorías, ciudades, farmacias, lotes, existencias y medicamentos. La prueba comprueba privilegios efectivos y membresías. La creación de identidades se realiza con la API administrativa local de GoTrue al preparar la práctica; el autorregistro público está desactivado.

## Recuentos de referencia

El catálogo tiene 12 productos, tres categorías y dos sucursales. El tamaño de página previsto es ocho. La semilla incluye un producto con dos lotes en distintas sucursales y productos sin especialización en medicamento.

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

La parada conserva el volumen y las identidades. Ante una conexión rechazada, comprueba que Docker Desktop esté iniciado con un motor local y que los puertos 55432 y 55433 estén disponibles. Puedes revisar `docker ps -a --filter label=com.docker.compose.project=vitafarma-practica` y los eventos del servicio afectado en Docker Desktop.

Si cambias de checkout, ejecuta `up` desde la nueva raíz para actualizar los montajes. Si existe el volumen pero se ha perdido la carpeta de claves, recupera esa carpeta desde tu copia privada. Para regenerar desde cero una práctica deliberadamente desechable, detén sus servicios, comprueba el nombre exacto del proyecto en Docker Desktop y elimina únicamente sus contenedores y el volumen `vitafarma-practica_datos` tras confirmar que quieres perder sus datos. Conservando la carpeta de claves, el siguiente `up` rehace los datos con las mismas cuentas. Ningún comando de arranque borra el volumen.

La autenticación usa el formato de claves asimétricas publicado para Supabase autoalojado. [Configuración oficial de claves de Supabase](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys)
