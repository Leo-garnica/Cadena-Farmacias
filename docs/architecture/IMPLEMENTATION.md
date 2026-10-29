# Entrega de arquitectura base

Fecha: 28/10/2026. Alcance aprobado en conversación: monolito modular y opción A.

## Resumen

- Monorepo npm con un lockfile raíz y comandos coordinados de desarrollo y verificación.
- Backend NestJS con nueve límites registrados e Inventario implementado como ejemplo
  de consulta por capas, puerto de lectura, adaptador demo y errores HTTP controlados.
- Frontend reorganizado en `app`, `modules/inventory` y `shared`, conservando recorridos
  y datos del piloto. Los loaders reciben dependencias por fábrica.
- Contratos públicos extraídos de los mocks a `packages/contracts`.
- Inter e Inter Tight locales, respetando paleta, tabla, panel y movimiento existente.
- Índice documental, matriz de 27 tablas, guía de desarrollo y registro de decisiones.

## Archivos cambiados

| Área | Cambios |
| --- | --- |
| Raíz | README, manifiesto npm, lockfile, `.gitignore` y caché npm local |
| `backend/` | Arranque y composición, infraestructura HTTP/configuración, nueve módulos, pruebas y README |
| `packages/contracts/` | Proyecciones de inventario, fecha, errores, salud y compilación independiente |
| `frontend/src/app/` | Composición del repositorio, router y entradas públicas de Inventario |
| `frontend/src/modules/inventory/` | Reubicación de vistas, reglas, contrato de repositorio y demo; fábrica de loaders |
| `frontend/src/shared/` | UI, utilidades, estilos y motion reubicados; nuevos tokens de fuentes |
| `frontend/tests/` | Imports actualizados y comprobación de fuentes en las pruebas visuales |
| `frontend/package.json` | Nombre de workspace y fuentes; se retiran lockfile y configuración npm anidados |
| `docs/` y README existentes | Índice, arquitectura y notas de vigencia; antecedentes conservados |

Los antiguos directorios `features`, `data`, `ui`, `motion`, `styles` y `lib` de
`frontend/src` se trasladan a las áreas anteriores. No se cambia el contrato de props
de los cinco componentes compartidos. El detalle mantiene su importación diferida.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| `npm install --no-audit --no-fund` | Dependencias instaladas; lockfile raíz generado a partir de las resoluciones originales |
| `npm ls --workspaces --depth=0` | Tres workspaces enlazados, sin dependencias faltantes |
| `npm run typecheck` | Pasó en contratos, frontend y backend |
| `npm run lint` | Pasó en frontend y backend, sin advertencias de ESLint |
| `npm run build` | Pasó; backend y SPA compilados, detalle en chunk separado y fuentes locales |
| `npm run dev` | Arranque conjunto verificado: salud API 200, consulta demo 200 e interfaz 200; grupo detenido al terminar |
| Pruebas de arquitectura | 3 aprobadas: dirección de dependencias, ciclos y rechazo de imports prohibidos |
| Pruebas backend | 11 aprobadas: HTTP, parámetros, errores, claves compuestas, nulos, resumen y aislamiento de datos demo |
| `npm run test:e2e` | 25 aprobadas en Chromium, sin reintentos |
| Repetición de `tests/visual.spec.ts` | 7 aprobadas con las nuevas aserciones de Inter/Inter Tight, responsive, contraste, fechas y movimiento reducido |

Las siete pruebas visuales son parte de las 25, no pruebas adicionales distintas.
Hay **39 pruebas diferentes** entre arquitectura, backend y frontend.

La primera ejecución de Playwright terminó sus comprobaciones, pero el sandbox de
Windows bloqueó el cierre del árbol npm/Vite. Se identificó y cerró solo el servidor
de esa ejecución; el runner terminó con código 0. La repetición visual fuera del
sandbox terminó normalmente en 14 segundos. No se modificó la configuración de
Playwright para ocultar este problema del entorno.

La revisión comprobó rendimiento, arquitectura y accesibilidad. Se conservaron carga diferida,
estado de filtros en URL, cancelación, semántica de controles y límites de motion.

## Capturas vistas realmente

Se inspeccionaron las capturas generadas por Chromium de:

- Listado de inventario a 360, 768 y 1280 px.
- Panel de detalle a 360 y 1280 px.

Se observaron jerarquía tipográfica, ajuste de tabla, filtros, panel y ausencia de
contenido recortado en esas vistas. Los archivos regenerables están bajo
`frontend/test-results/visual-responsive-*/`. Las pruebas también comprobaron foco,
Escape, navegación por teclado, retorno del foco, movimiento reducido, contraste de
los selectores cubiertos y fechas en La Paz/Kiritimati.

No se probaron Firefox, WebKit ni lectores de pantalla. La comprobación de contraste
cubre elementos concretos y no acredita una auditoría completa de accesibilidad.

## Revisión del cambio

El repositorio comenzó con todos sus archivos sin seguimiento. Por eso `git diff`
no representa por sí solo el cambio de esta sesión. Se guardó una referencia local de
144 archivos en `.cache/architecture-baseline/` antes de editar y se compara mediante
hash SHA-256. La referencia y los reportes son locales e ignorados por Git.

La comparación confirmó **89 archivos protegidos sin cambios**: instrucciones y recursos
locales, SQL académicos, llenado, snapshot SQL y configuración Supabase. También confirmó
el cuerpo de los cinco componentes compartidos y los dos archivos de fixtures/repositorio
demo frontend sin cambios, excluyendo imports. Los 26 Markdown del proyecto revisados
no tienen enlaces locales rotos. El detalle local está en
`.cache/architecture-baseline/review.json` y el diff en `changes.diff` de esa carpeta.

Ejemplo del cambio de dirección de dependencias:

```diff
- // El loader tomaba el adaptador de un singleton de datos.
- import { inventoryRepository } from '../../data/repositories'
+ // El módulo recibe el puerto; app/ elige el adaptador.
+ export function createInventoryLoaders(inventoryRepository: InventoryRepository) {
+   // loaders con el mismo comportamiento de consulta
+   return { metadataLoader, inventoryLoader, detailLoader }
+ }
```

El ejemplo resume el cambio; el diff local contiene los archivos completos.

## Pendientes

- Autenticación, autorización por rol/sucursal y verificación actual de permisos remotos.
- Contrato y adaptador PostgreSQL; la interfaz y API actuales siguen usando demos independientes.
- Reglas transaccionales, IDs concurrentes y precisión monetaria antes de escrituras.
- Desarrollo funcional de los ocho módulos reservados.
- Alojamiento de producción, fuera del alcance local.

No se ejecutaron comandos de BD, migraciones o SQL; no se leyeron credenciales ni se
crearon archivos de entorno. No se hizo staging, commit, push, PR o despliegue.
