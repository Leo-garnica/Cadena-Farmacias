# Guía de desarrollo

## Preparación

Trabajar desde la raíz del repositorio con Node.js >=22.12 compatible con Vite 8.
Se verificó Node 22.23.3 y npm 10.9.9 en este equipo.

```sh
npm ci
npm run dev
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
npm.cmd run dev
```

La ruta es específica de este equipo; no es una instalación adicional ni un cambio
global de nvm. `npm.cmd` evita ejecutar `npm.ps1` cuando la política de PowerShell lo
bloquea. No es necesario cambiar la política de ejecución.

## Flujo diario

- `npm run dev`: contratos, API en 3000 y frontend en 5173, ambos en loopback.
- `npm run dev:frontend`: interfaz independiente; no requiere API.
- `npm run dev:backend`: solo API; `PORT` permite escoger otro puerto local.
- Editar contratos exige recompilarlos con `npm run build:contracts` o reiniciar el
  comando raíz. Los comandos de desarrollo compilan contratos al arrancar.
- Backend utiliza `tsc --watch` y `node --watch`; la compilación conserva decoradores NestJS.
- El puerto 5173 es estricto: resolver una instancia ocupada antes de iniciar otra.
- `Ctrl+C` termina el grupo de desarrollo; los procesos se gestionan con concurrently.

## Verificaciones

```sh
npm run typecheck
npm run lint
npm run build
npm run test:architecture
npm run test:backend
npm run test:e2e
```

`npm run check` ejecuta la secuencia completa. Las pruebas backend usan `node:test` y
una API local en puerto efímero. No precisan servidor PostgreSQL ni credenciales.

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

## Base de datos y siguientes decisiones

Para consultar Supabase deberá aprobarse primero el contrato de acceso. Las decisiones
pendientes incluyen autenticación, autorización por rol/sucursal, permisos efectivos,
adaptador PostgreSQL, IDs concurrentes, precisión monetaria y transacciones.

No ejecutar `Scripts/`, el snapshot, seeds o comandos de Supabase para levantar la app.
La configuración local existente no demuestra el estado del servicio remoto. Cualquier
cambio estructural deberá presentarse como migración incremental para revisión, sin
ejecutarla automáticamente.
