# VitaFarma · Frontend de Inventario

Frontend de consulta implementado con **React + TypeScript + Vite**. Conserva el recorrido del piloto de Inventario y ahora forma parte de la [base modular](../docs/architecture/ARCHITECTURE.md). Opción A aprobada el 28/10/2026: mesa de control con Inter e Inter Tight, manteniendo paleta, tabla y panel de detalle.

**Datos simulados · Solo consulta.** No requiere una cuenta, credenciales, variables de entorno ni conexión a Supabase. Los precios, sucursales y existencias son ejemplos sintéticos. No se pueden registrar ventas ni movimientos.

## Abrir la aplicación

Desde la raíz del repositorio, en CMD o PowerShell:

```text
npm ci
npm run dev:frontend
```

Abre **http://127.0.0.1:5173/**. La ruta inicial redirige a Inventario. El servidor escucha solo en la máquina local. `Ctrl+C` lo detiene. Si el puerto ya está ocupado, Vite lo informa sin cambiar de puerto; revisa si ya hay una instancia de VitaFarma abierta.

Requisito: Node **22.12 o superior** compatible con Vite 8. Entorno usado para verificar este incremento: **Node 22.23.3 / npm 10.9.9**. Las versiones exactas de las dependencias están en `package.json` y `package-lock.json`; para reproducir la instalación usa `npm ci`.

### Si esta terminal dice “No active Node.js version is configured”

En este equipo existe una instalación de Node 22.23.3, aunque el ejecutable intermediario de nvm no tiene una versión activa. Se comprobó el ejecutable directamente. Puedes anteponer su carpeta **solo al PATH de esta terminal**, sin instalar ni activar globalmente otra versión.

PowerShell, antes de los comandos de npm:

```powershell
$env:Path = 'C:\Users\Leo\AppData\Local\Author Software\nvm\installs\v22.23.3;' + $env:Path
node --version
npm --version
```

CMD:

```bat
set "PATH=C:\Users\Leo\AppData\Local\Author Software\nvm\installs\v22.23.3;%PATH%"
node --version
npm --version
```

Esta ruta corresponde al equipo donde se verificó el piloto; en otro equipo utiliza su propia instalación de Node. En PowerShell usar `npm.cmd` si se bloquea `npm.ps1`. `.npmrc` de la raíz mantiene la caché en `.cache/npm`. La instalación y el lockfile ahora son únicos en la raíz. Las fuentes se sirven desde el proyecto, sin consultas a Google Fonts.

## Comprobaciones

Desde la raíz del repositorio:

```text
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Chromium ya se descargó en `frontend/.browsers/` en este equipo. Para instalarlo en otra copia del proyecto:

PowerShell:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) 'frontend/.browsers'
npm.cmd exec --workspace @vitafarma/frontend -- playwright install chromium
npm run test:e2e
```

CMD:

```bat
set "PLAYWRIGHT_BROWSERS_PATH=%CD%\frontend\.browsers"
npm exec --workspace @vitafarma/frontend -- playwright install chromium
npm run test:e2e
```

`playwright.config.ts` usa esa carpeta por defecto, inicia Vite cuando hace falta y permite reutilizar el servidor local. El navegador de pruebas se ejecuta sin ventana. No hay que configurar un navegador global.

| Comprobación ejecutada | Resultado final |
| --- | --- |
| `npm run typecheck` | Pasó, sin errores de TypeScript |
| `npm run lint` | Pasó, sin errores ni advertencias de ESLint |
| `npm run build` | Pasó; artefactos locales en `dist/` |
| `npm run test:e2e` | **25 pruebas aprobadas**, Chromium, sin reintentos |

La suite verifica integridad de fixtures, cantidades cero/nulas/ausentes, búsqueda por nombre/código y sin tildes, filtros, orden, paginación, resumen consistente, historial, enlaces directos, recarga, pestañas, recuperación de errores, rutas inexistentes y ausencia de solicitudes externas/errores de consola en el recorrido normal.

También comprueba teclado, foco visible y retorno al disparador, Escape, contención del foco en el panel, cierre visible al desplazar el panel, movimiento reducido, ausencia de desbordamiento general a **360 / 768 / 1280 px**, contraste de los principales textos/controles/estados (mínimo 4,5:1) y fechas en **America/La_Paz** y **Pacific/Kiritimati**. Esto no equivale a una auditoría completa con lectores de pantalla ni a pruebas en todos los navegadores; Firefox, WebKit y lectores de pantalla no se probaron.

Se corrigieron un valor esperado incorrecto en una prueba de resumen y dos selectores/comparaciones de prueba. La revisión visual corrigió la visibilidad del menú de escritorio, una etiqueta duplicada y la cabecera desplazable del detalle. Las 25 pruebas volvieron a pasar después de esas correcciones.

```text
npm run test:report --workspace @vitafarma/frontend
```

Abre el informe local de Playwright. Las capturas están en `test-results/visual-responsive-*/inventario-*.png` y `detalle-*.png`; se generan de nuevo al ejecutar la suite. Se inspeccionaron realmente capturas de listado en móvil/tablet/escritorio y de detalle en móvil/escritorio. Los reportes, cachés, navegadores y `dist/` están excluidos mediante `.gitignore`.

Para servir el build local:

```text
npm run preview --workspace @vitafarma/frontend
```

Dirección del preview: `http://127.0.0.1:4173/`. `build` y `preview` no publican el proyecto.

## Recorrido manual

1. Abre Inventario y comprueba la etiqueta de datos simulados y la referencia **25/10/2026**.
2. Elige **Norte**, busca `10` y ordena por **Código: menor a mayor**.
3. Avanza a la segunda página. El resumen sigue describiendo el conjunto filtrado completo.
4. Abre **Ver detalle** de Omeprazol. Cambia entre **Producto** y **Lote asociado**.
5. Cierra con el botón, **Escape** o **Atrás**. Se conservan sucursal, búsqueda, categoría, estado, orden y página. El foco vuelve al enlace que abrió el panel.
6. Filtra **Primeros auxilios**, prueba **Sin unidades (0)** y **Cantidad no registrada**, y limpia los filtros.
7. Prueba una búsqueda sin coincidencias. El estado vacío ofrece limpiar filtros.

La búsqueda se aplica con **Buscar** o Enter; los selectores se aplican al cambiar. Los cambios de filtros/orden reinician la página. La categoría se consulta en el detalle en las anchuras intermedias donde se oculta esa columna; en móvil las filas se organizan verticalmente conservando sus etiquetas.

## Rutas y ejemplos

| Ruta | Comportamiento |
| --- | --- |
| `/` | Redirección a `/inventario` |
| `/inventario` | Consulta por sucursal; URL con estado normalizado |
| `/inventario/1/1001` | Paracetamol, sucursal Central, cantidad positiva y lote vencido |
| `/inventario/1/1002` | Registro con cantidad **0** |
| `/inventario/1/1003` | Registro con cantidad **NULL** y sin lote |
| `/inventario/1/1004?tab=lote` | Lote que vence el día de referencia demo |
| `/inventario/1/1009?tab=lote` | Lote asociado con fecha de vencimiento no registrada |
| `/inventario/1/1020` | Producto conocido, **sin registro de stock** en Central |
| `/inventario/2/1024` | Producto no medicamento, con campos no registrados |
| `/inventario/999/1001` | Estado de registro no encontrado |
| `/no-existe` | Página no encontrada con enlace de retorno |

Parámetros persistidos: `farmacia`, `q`, `categoria`, `estado`, `orden`, `pagina` y `tab=lote` para el detalle. La clave de la ruta de detalle es `(idFarmacia, codigoProducto)`; prevalece sobre una sucursal contradictoria en el query string. Los parámetros desconocidos, opciones inválidas y páginas fuera de rango se normalizan mediante reemplazo de URL. Cambiar de pestaña reemplaza la entrada actual del historial para que Atrás cierre el detalle.

Accesos para reproducir estados de consulta, sin controles técnicos en la pantalla:

- `/inventario?farmacia=2&q=10&demo=error`: error recuperable. **Reintentar** retira la simulación y conserva los filtros.
- `/inventario?demo=slow`: demora sintética de 1,5 s por carga del loader para observar el estado de carga. La primera normalización de URL puede producir una segunda carga. Retira `demo=slow` para volver a respuesta inmediata.

## Datos y fidelidad al esquema

El contrato se basa en [DB-CONTEXT.md](../docs/DB-CONTEXT.md) y la [exportación verificada](../docs/schema-supabase-actual.sql), con contraste del SQL académico y de la lógica de llenado, sin ejecutar esos scripts.

- **3 sucursales / 24 productos / 48 registros de stock**; 16 registros por sucursal, 6 categorías y 24 lotes de catálogo. Los 12 primeros productos tienen especialización `medicamento`. Los demás no la tienen.
- Cada sucursal permite consultar los 24 productos; 8 carecen de registro en ella. Es una proyección de catálogo con stock opcional, no 72 filas de stock inventadas.
- PK de stock única por `(id_farmacia, codigo_producto)`, con un único lote opcional. Toda asociación de lote pertenece al producto correspondiente.
- El resumen cuenta registros del conjunto filtrado completo. Nunca suma unidades de presentaciones diferentes. Central sin filtros tiene **16 registros**, **11 con existencias**, **3 con cero**, **2 con cantidad nula**, **8 productos sin registro** y **2 registros con lote vencido**.
- Se conserva `cantidad = NULL` como **No registrado**; no se sustituye por cero. Una fila ausente y un lote no asociado tienen explicaciones diferentes.
- Las fechas PostgreSQL `DATE` se conservan como cadenas ISO sin hora. El formateo usa construcción y zona UTC explícitas para evitar cambios de día por zona del navegador.
- La referencia fija es **2026-10-25**. Fechas anteriores: **Vencido**; fecha igual: **Vence en fecha demo**; posteriores: **Vigente**. No se infiere una regla de bloqueo de venta ni se sincroniza con el vencimiento general de medicamento.
- No se inventaron mínimos de stock ni alertas de reposición. No hay datos de usuarios, pacientes, empleados o clientes en los fixtures.

## Organización y decisiones de implementación

```text
frontend/
├── package.json, .gitignore     # Lockfile e instalación en la raíz
├── index.html, vite.config.ts, tsconfig*.json, eslint.config.js
├── playwright.config.ts, README.md
├── public/favicon.svg
├── src/
│   ├── main.tsx
│   ├── app/                    # Shell, marca, sidebar, router y estados de ruta
│   ├── shared/                 # ui/, motion/, styles/ y lib/
│   └── modules/inventory/
│       ├── domain/             # Tipos y estados
│       ├── application/        # Puerto de lectura y parámetros de consulta
│       ├── infrastructure/demo/ # Fixtures y repositorio sintético
│       ├── presentation/       # Vistas, loaders y CSS
│       ├── public.ts           # Integración pública con shell y router
│       ├── demo.ts             # Adaptador para composición
│       └── detail.ts           # Entrada del detalle diferido
└── tests/                      # Datos, recorrido de consulta, responsive y accesibilidad
```

`app/repositories.ts` compone el repositorio y lo entrega a la fábrica de loaders. Los contratos están en `packages/contracts`; no dependen de los mocks. El módulo no importa `app/` y `shared/` no importa módulos. Los imports se actualizaron junto con las pruebas; no cambian las props de los componentes compartidos.

React Router en **Data Mode** resuelve loaders, parámetros, errores y acceso directo. El detalle se importa cuando se necesita. Los filtros viven en la URL; no se añadió un gestor de estado global ni almacenamiento persistente. Resumen, filas y estados derivan de los datos; no hay copias de esos valores en estados React que puedan desincronizarse. Las consultas del mock aceptan cancelación y usan mapas para relacionar claves. El repositorio tiene únicamente métodos de lectura.

Sistema visual: verde bosque `#0B4937`, fondo `#F6F8F5`, texto `#19362D`, selección `#DCE9DC`, advertencia `#805714`, error `#A52A32` y foco `#345AB4`. Inter 400/500/600 para interfaz e Inter Tight 700/800 para títulos y marca, siguiendo la tipografía inspeccionada de UMSSY. CSS propio; sin librería de gráficos ni componentes de una tienda pública.

Los tres patrones compartidos de motion son: apertura de panel/navegación móvil (**220 ms**), continuidad del indicador de pestaña (**160 ms**) y feedback de controles/resultados (**120 ms**). No se animan filas ni contadores. Motion y CSS respetan `prefers-reduced-motion`; los controles permanecen disponibles durante las transiciones. Radix Dialog y Tabs gestionan semántica y teclado.

### Referencias de diseño y desarrollo

La aprobación de base modular y opción A está registrada en [decisiones](../docs/architecture/DECISIONS.md). La revisión técnica y de interfaz contempla rendimiento React, navegación, accesibilidad y movimiento reducido.

Se consultaron las páginas de referencia aprobadas: [Oripio](https://dribbble.com/shots/26765569-Pharmacy-Website), [Pulse Clinic](https://dribbble.com/shots/27699617-Pulse-Clinic-Counter-to-Supplier-Pharmacy-Dashboard-Animation), [UGEM](https://dribbble.com/shots/15688426-Pharmacy-App-Landing-Page-Animation) y [Rixlab](https://dribbble.com/shots/27528928-Healthcare-Dashboard-Animation). Se usaron los principios de identidad verde, jerarquía y continuidad definidos en el plan; no se copiaron marcas, imágenes o pantallas. La lectura de esas páginas no acredita reproducción de sus videos.

La implementación técnica se contrastó con [Motion](https://motion.dev/docs/react-layout-animations), [React Router Data Mode](https://reactrouter.com/start/data/routing), [Vite](https://vite.dev/guide/) y las [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). La revisión final atendió etiquetas, semántica, foco, estados, responsive, contraste, enlaces reales y movimiento reducido; la evidencia de navegador está en las pruebas y capturas locales.

## Límites y siguiente fase

Inventario es el único módulo operable en la interfaz. Catálogo, Proveedores y Reportes solo aparecen como **Próximamente**, sin enlaces rotos ni acciones ficticias. Existe una API demo independiente en `backend/`; este frontend todavía no la consume. No hay autenticación, edición, ventas, compras, facturación, movimientos ni cliente Supabase.

Para integrar datos reales deberá aprobarse primero el contrato de acceso y resolver autenticación, roles, permisos, RLS o un backend seguro. Entonces podrá reemplazarse `inventoryRepository` manteniendo las proyecciones y la semántica de nulos/fechas. Triggers, operaciones transaccionales y nuevos módulos requieren otro alcance.

La comprobación histórica del piloto quedó ampliada por la [entrega de arquitectura](../docs/architecture/IMPLEMENTATION.md), que registra las verificaciones de esta fase. Supabase, Data API, SQL, triggers, RLS y credenciales siguen fuera de los cambios. No se hizo `git add`, commit, push, merge o deploy.
