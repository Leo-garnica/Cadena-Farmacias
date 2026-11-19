# Guía de desarrollo

## Preparación

Trabajar desde la raíz con Node.js >=22.12 compatible con Vite 8, npm 10 y Docker con contenedores Linux y Compose v2.
Se verificó Node 22.23.3 y npm 10.9.9 en este equipo.

```sh
npm ci
npm run dev:practica
```

`npm ci` instala todos los workspaces usando el único lockfile raíz. Para agregar una
dependencia autorizada a un módulo de aplicación, usar por ejemplo
`npm install PAQUETE --workspace @vitafarma/backend --save-exact` desde la raíz.
No copiar `node_modules`, dependencias ni scripts de otro proyecto.

### Particularidades de este equipo Windows

Si `node --version` responde «No active Node.js version is configured», se puede
anteponer la instalación ya existente al PATH **solo de la terminal actual**:

```powershell
$env:Path = 'C:\Users\Leo\AppData\Local\Author Software\nvm\installs\v22.23.3;' + $env:Path
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run dev:practica
```

La ruta es específica de este equipo; no es una instalación adicional ni un cambio
global de nvm. `npm.cmd` evita ejecutar `npm.ps1` cuando la política de PowerShell lo
bloquea. No es necesario cambiar la política de ejecución.

## Flujo diario

- `npm run dev:practica` prepara el dataset VF-PRACTICA-1, verifica PostgreSQL y Auth e inicia Vite y NestJS. Usa este modo para contrastar los indicadores con los recuentos de referencia.
- `npm run dev:gestion` prepara la copia persistente del Trabajo 4 y conecta a ella el lector del inventario y el escritor de gestión. El supervisor accede a los formularios académicos y ventas.
- `npm run dev` inicia los dos servidores con la configuración que ya tenga el proceso. Los dos comandos anteriores preparan las variables de cada entorno.
- `npm run dev:frontend` inicia Vite; la portada es pública y las rutas internas necesitan la API y Auth.
- `npm run dev:backend`: solo API; `PORT` permite escoger otro puerto local.
- Editar contratos exige recompilarlos con `npm run build:contracts` o reiniciar el
  comando raíz. Los comandos de desarrollo compilan contratos al arrancar.
- Backend utiliza `tsc --watch` y `node --watch`; la compilación conserva decoradores NestJS.
- El puerto 5173 es estricto: resolver una instancia ocupada antes de iniciar otra.
- `Ctrl+C` detiene los servidores web y API. Ejecuta `node local/practica.mjs stop` para detener también PostgreSQL y Auth y conservar el volumen.

## Verificaciones

```sh
npm run typecheck
npm run lint
npm run build
npm run test:architecture
npm run test:backend
npm run test:e2e
```

La secuencia estándar corre con `npm run check`. Los casos unitarios, los del contrato HTTP y Playwright usan datos y respuestas controladas. Para comprobar la integración con servicios reales, ejecuta aparte:

| Entorno | Recorrido |
| --- | --- |
| Modo consulta iniciado | `node local/practica.mjs verify` contrasta permisos SQL, dataset, firma e identidades. |
| Modo consulta y backend compilado | `node backend/integration/inventory-practica.mjs` compara API, PostgreSQL y sucursales. `--rendimiento` añade mediciones. |
| Modo consulta con la API en 3000 | `npm run test:auth:practica --workspace @vitafarma/frontend` recorre acceso e inventario con Chromium. Requiere el puerto 4173 libre. |
| Modo gestión y backend compilado | La prueba de los ocho formularios y las ventas se ejecuta con la cuenta local de práctica. [Comando y precondiciones](../../backend/src/modules/sales/README.md) |

En esta copia Chromium ya está en `frontend/.browsers`. En una copia nueva, con
autorización para descargar el navegador:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) 'frontend/.browsers'
npm.cmd exec --workspace @vitafarma/frontend -- playwright install chromium
npm.cmd run test:e2e
```

El `playwright.config.ts` conserva esa carpeta como predeterminada. El reporte HTML y
las capturas quedan en `frontend/playwright-report` y `frontend/test-results`; se
regeneran y no se versionan. Para abrir el informe:

```sh
npm run test:report --workspace @vitafarma/frontend
```

## Implementar un caso de uso nuevo

1. Leer las reglas de ejecución, la matriz de módulos, DB-CONTEXT y las decisiones vigentes.
2. Precisar entradas, salidas, permisos y reglas; distinguir propuestas de requisitos.
3. Ubicarlo en el módulo propietario de las tablas y definir su contrato mínimo.
4. Crear reglas de dominio, caso de uso y puerto; implementar un adaptador explícito.
5. Añadir controlador o vista y componer dependencias en el límite de la aplicación.
6. Exponer solo lo que otros módulos necesitan en `public.ts`.
7. Verificar reglas relevantes, errores, dependencias y recorrido de usuario.
8. Actualizar estado del módulo y documentación con resultados realmente ejecutados.

No editar directamente las tablas ajenas desde otro módulo. Para una operación que
abarque varios dominios, diseñar primero su coordinación y transacción. Los nombres
`domain/application/infrastructure/presentation` no obligan a crear clases o archivos
sin responsabilidad concreta.

## Supabase académico

El lector del monolito verifica permisos efectivos para siete tablas, ejecuta consultas parametrizadas y exige conexión TLS validada para un host externo. La validación del proyecto académico remoto queda pendiente de una credencial lectora mínima. Los arranques de práctica apuntan a la máquina local. El modelo y los scripts originales se conservan como fuentes académicas. [Entorno y conexiones](ENTORNO-LOCAL.md)
