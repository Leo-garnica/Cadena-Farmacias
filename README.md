# VitaFarma · Cadena-Farmacias

VitaFarma permite consultar existencias por sucursal y registrar operaciones de una cadena de farmacias en una copia académica local. La aplicación usa React, Vite y TypeScript, una API NestJS organizada en nueve módulos, PostgreSQL y Supabase Auth.

## Abrir VitaFarma

Instala Node.js 22.12 o superior y usa npm 10. Para los entornos de práctica se requiere Docker con contenedores Linux y Compose v2. Desde la raíz del repositorio instala los workspaces con el único lockfile:

```sh
npm ci
```

Arranca **uno** de los dos modos. Cada comando prepara sus servicios, carga la configuración local de cada proceso e inicia la web y la API.

| Comando | Base PostgreSQL local | Qué permite |
| --- | --- | --- |
| `npm run dev:practica` | `vitafarma_practica` | Consultar el dataset de control VF-PRACTICA-1 y contrastar sus indicadores. |
| `npm run dev:gestion` | `vitafarma_gestion` | Consultar y administrar datos sintéticos persistentes para el Trabajo 4. El inventario refleja las ventas de esta copia. |
| `npm run dev:comercio` | `vitafarma_comercio` | Probar tienda, pago simulado, retiro, envío, caja y supervisión por departamento. [Cuentas y recorrido de comercio](docs/planning/COMERCIO-LOCAL.md) |

Abre [VitaFarma en tu equipo](http://127.0.0.1:5173/). Desde la portada entra al espacio del equipo. Para consultar usa `operador@vitafarma.test`; para las operaciones de gestión usa `supervisor@vitafarma.test`. El arranque guarda las contraseñas aleatorias en `.vitafarma/practica-v1/cuentas.json`, dentro de tu carpeta personal. [Acceso y perfiles](docs/SUPABASE-LOGIN.md)

Para cambiar de modo, detén primero la web y la API con **Ctrl+C**. Comprueba los servicios y el dataset de control con `node local/practica.mjs verify`. Para detener también PostgreSQL y Auth usa `node local/practica.mjs stop`. La parada conserva el volumen. [Entorno local](docs/architecture/ENTORNO-LOCAL.md)

## Pantallas

Para preparar la defensa, el [informe del Trabajo 4](docs/trabajo-4/VitaFarma-interfaces.pdf) reúne las pantallas y sus filas en PostgreSQL. El [acta de entrega](docs/planning/CIERRE-RELEASE-2026.md) enlaza las pruebas y las decisiones de los tres sprints.

| Ruta | Función |
| --- | --- |
| `/` y `/equipo/entrar` | Portada pública e ingreso del personal con Supabase Auth. |
| `/inventario` | Listado paginado, búsqueda, filtros y detalle por farmacia y producto. |
| `/indicadores` | Registros de stock, registros con cero unidades y lotes vencidos dentro de los filtros de la sucursal. Cada indicador abre su lista de inventario. |
| `/practica/:recurso` | Sucursales, empleados, productos, medicamentos, clientes, descuentos, planillas y fichas de usuarios académicos en modo gestión. |
| `/practica/ventas` | Selección de productos, registro de la venta y consulta de su detalle en la copia de gestión. |

NestJS valida la identidad, el perfil y las sucursales en cada consulta protegida. Las dos prácticas usan PostgreSQL real con datos sintéticos. La integración de lectura con el Supabase académico remoto queda pendiente de una cuenta lectora mínima y su comprobación. [Arquitectura](docs/architecture/ARCHITECTURE.md)

## Desarrollo y pruebas

Los procesos de desarrollo usan web en `127.0.0.1:5173` y API en `127.0.0.1:3000`. `GET /api/v1/health` indica que la API responde. `GET /api/v1/ready` verifica la conexión lectora y sus permisos; devuelve 503 si falla. Para compilar y verificar código usa `npm run check`. La guía incluye Chromium, los ensayos con PostgreSQL y los comandos por workspace. [Guía de desarrollo](docs/architecture/DEVELOPMENT.md)

## Estructura

| Directorio | Contenido |
| --- | --- |
| `frontend/` | Portada, acceso, inventario, indicadores y gestión académica. |
| `backend/` | Monolito NestJS, acceso a PostgreSQL, API y pruebas. |
| `packages/contracts/` | Contratos compartidos de TypeScript independientes del framework. |
| `local/` | Servicios, datos ficticios y comprobaciones de los entornos de práctica. |
| `Scripts/`, `supabase/` | Referencias académicas y recursos de Supabase. |
| `docs/` | Arquitectura, decisiones, planificación y evidencia de entrega. |

El plan de noviembre conserva las fechas, las prioridades y la aceptación de cada sprint. Para priorizar la entrega se retiraron los dos P1 opcionales de consulta de proveedores e historial comercial. La gestión de ventas del Trabajo 4 tiene su propio alcance local. [Índice de documentación](docs/README.md) · [Plan y tableros](docs/planning/README.md)
