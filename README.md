# VitaFarma · Cadena-Farmacias

Base de desarrollo con **monolito modular NestJS + TypeScript**, frontend
**React + Vite** y contratos de lectura compartidos. El modelo académico PostgreSQL
se conserva. Esta base funciona localmente con datos sintéticos.

## Empezar

Requiere Node.js **22.12 o superior** compatible con Vite 8 y npm 10.
Ejecutar desde la raíz, donde está este README:

```sh
npm ci
npm run dev
```

- Interfaz: <http://127.0.0.1:5173/inventario>
- Salud de la API demo: <http://127.0.0.1:3000/api/v1/health>
- `Ctrl+C` detiene los servidores locales.

En PowerShell, si la política bloquea `npm.ps1`, usar `npm.cmd` en lugar de `npm`.
Si el intermediario de nvm informa que no hay una versión activa, consultar la
[guía de desarrollo](docs/architecture/DEVELOPMENT.md), sin cambiar políticas del sistema.

## Estructura

```text
backend/             Monolito: módulos, infraestructura técnica y pruebas
frontend/            SPA: composición, módulo Inventario y UI compartida
packages/contracts/  Contratos públicos TypeScript sin framework
docs/                Índice, arquitectura, decisiones y antecedentes
Scripts/             SQL académico y llenado masivo originales
supabase/            Recursos locales; config.toml no se versiona
```

Hay un solo backend y una sola base de datos prevista. Los módulos se comunican
mediante interfaces públicas dentro del proceso. No hay servicios independientes.
La explicación completa está en [Arquitectura](docs/architecture/ARCHITECTURE.md).

## Qué está disponible

| Área | Estado |
| --- | --- |
| Frontend Inventario | Consulta navegable con 3 sucursales, 24 productos y 48 registros de stock sintéticos |
| API Inventario | Ejemplo local de lectura con un corpus independiente de 4 productos sintéticos |
| Sucursales, Catálogo, Proveedores, Ventas, Personal, Acceso, Auditoría y Reportes | Límites registrados y documentados; funcionalidad pendiente |
| Supabase y operaciones reales | Desconectados; integración pendiente de contratos y autorización |

El frontend sigue funcionando sin arrancar la API. No se presenta la demostración
como una conexión operativa ni como implementación de autenticación, ventas o facturación.

## Comandos

| Comando desde la raíz | Propósito |
| --- | --- |
| `npm run dev` | Arrancar API y frontend con recarga |
| `npm run dev:frontend` | Trabajar solo en la interfaz |
| `npm run dev:backend` | Trabajar solo en la API |
| `npm run typecheck` | Compilar contratos y comprobar tipos de los workspaces |
| `npm run lint` | Revisar código frontend y backend |
| `npm run build` | Compilar contratos, backend y frontend; no publica nada |
| `npm run test:architecture` | Verificar dependencias y ciclos entre módulos |
| `npm run test:backend` | Probar HTTP y semántica de consulta, sin BD |
| `npm run test:e2e` | Ejecutar el recorrido y revisión responsive en Chromium |
| `npm run check` | Ejecutar todas las comprobaciones anteriores |

Usar el **único `package-lock.json` de la raíz**. Las dependencias de cada workspace
se declaran en su propio `package.json`. Chromium es un requisito adicional para las
pruebas de navegador; ver [instalación y pruebas](docs/architecture/DEVELOPMENT.md).

## Documentación y reglas

Leer primero el [índice de documentos](docs/README.md), la
[matriz de módulos y tablas](docs/architecture/MODULES.md) y las
[decisiones](docs/architecture/DECISIONS.md).

Para el trabajo siguiente, consultar la [planificación de noviembre](docs/planning/README.md):
plan de release, reglas y todas las tareas/subtareas de los tres sprints, con fechas,
horas, dependencias y criterios de cierre. El plan comienza con landing y conduce
a inventario conectado y dashboard verificable; no convierte las demos actuales
en integración real ni autoriza ejecutar esos cambios por sí solo.

La tipografía aprobada es **Inter para interfaz e Inter Tight para títulos**,
tomando UMSSY como referencia y conservando la paleta y composición de VitaFarma.
Las fuentes se sirven localmente.

Las [reglas de ejecución](docs/planning/REGLAS-DE-EJECUCION.md) rigen los cambios.
Los SQL y el snapshot de Supabase son fuentes
de consulta, no scripts de inicio. No ejecutar llenados, migraciones o reinicios de BD
para abrir esta aplicación. El estado remoto no se verificó nuevamente en esta fase.
