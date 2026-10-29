# Sprint 2 — Acceso e inventario integrado

[Índice](README.md) · [Reglas](REGLAS-DE-EJECUCION.md) · [Plan completo](../VITAFARMA-PLAN-RELEASE-Y-SPRINTS-2026.md)

**Fechas de 2026:** 9–17 de noviembre  
**Capacidad bruta:** 42 h · **Plan:** 34 h · **Reserva:** 8 h  
**Responsable de todas las subtareas:** desarrollador principal. Apoyo ocasional solo para revisión; no es dependencia obligatoria.

## Objetivo y entrada

Entregar el recorrido landing → login → sucursal autorizada → búsqueda → detalle → regreso, consultando PostgreSQL mediante NestJS, sin dashboard nuevo ni escrituras de negocio.

Entrada: G1 aceptado, base estable, contratos y matriz de acceso aprobados, entorno local disponible. Cambios de puertos/contratos compartidos, Auth, configuración y dependencias deben estar incluidos en el bloque autorizado; no se implementan por copiar el tablero.

## Secuencia prevista

- 09–10/11: identidad y protección de servidor.
- 10–12/11: sucursales, catálogo y consultas paginadas de inventario.
- 12–16/11: UI conectada por HTTP y manejo de estados.
- 13/11: control de mitad de periodo: identidad y una lectura real protegida verificables; retirar P1 si se retrasa.
- 16–17/11: pruebas, correcciones y G2.

## Todas las tareas y subtareas

Estado inicial de cada fila: **Pendiente**. Cambiar la última columna al trabajar y añadir evidencia en el registro inferior. No marcar completada una función por existir un mock o una prueba histórica. Las horas de las subtareas suman las del bloque: no sumarlas dos veces. Las esperas de aprobación tienen 0 h de esfuerzo y pueden desplazar fechas.

### S2-01 — Integrar identidad y autorización

**Epic:** E03 · **Prioridad:** P0 · **Total:** 6 h  
**Ventana:** 09–10/11  
**Dependencias del bloque:** G1 aceptado; S1-03/05; implementación de acceso autorizada

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S2-01.01 | 2 | G1; S1-05 | Conectar login/logout al proveedor aprobado y resolver identidad en la aplicación. | Cuenta reconocida inicia y cierra sesión; sin cuentas o contraseñas de fallback. | Pendiente |
| S2-01.02 | 2 | S2-01.01 | Verificar firma, emisor, audiencia y vigencia de token en NestJS; proteger rutas internas por defecto. | Sin token, alterado o vencido recibe rechazo real del backend; /me devuelve solo identidad permitida. | Pendiente |
| S2-01.03 | 1 | S2-01.02; matriz S1-03 | Resolver perfil y sucursales en servidor; denegar identidades sin mapeo y alcance ajeno. | La autorización no depende del selector UI ni de metadata editable del usuario. | Pendiente |
| S2-01.04 | 1 | S2-01.03 | Resolver expiración/renovación y limpieza de datos/cache al cambiar cuenta o cerrar sesión. | No se reutilizan datos de un usuario anterior; expiración permite recuperación clara. | Pendiente |

### S2-02 — Consultar sucursales y catálogo mínimo

**Epic:** E04 · **Prioridad:** P0 · **Total:** 5 h  
**Ventana:** 10–11/11  
**Dependencias del bloque:** S2-01; S1-02/03/05

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S2-02.01 | 2 | S2-01 | Implementar consulta de sucursales/metadatos desde persistencia, aplicando alcance también a opciones. | Solo devuelve sucursales permitidas; datos globales innecesarios no se filtran al cliente. | Pendiente |
| S2-02.02 | 2 | S2-02.01 | Implementar categorías y proyección mínima de producto; conservar la API actual donde cubra el caso. | Datos salen de BD, con nulos y relaciones correctos; no se crea un CRUD por tabla. | Pendiente |
| S2-02.03 | 1 | S2-02.02 | Mapear DTO y comprobar integración y ausencia de columnas privadas. | Respuesta contrastada con dataset; sin contraseñas, salarios u otros campos no necesarios. | Pendiente |

### S2-03 — Migrar consulta de inventario a PostgreSQL paginado

**Epic:** E05 · **Prioridad:** P0 · **Total:** 6 h  
**Ventana:** 11–12/11  
**Dependencias del bloque:** S2-01/02; impacto de puertos/contratos aprobado

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S2-03.01 | 1 | S1-03; S2-02 | Precisar y aprobar impacto del puerto paginado/asíncrono y sus consumidores; ajustar contrato autorizado. | No se adapta rows() cargando todo; metadatos ya no suponen acceso síncrono o irrestricto. Si falta aprobación, bloquear implementación dependiente. | Pendiente |
| S2-03.02 | 2 | S2-03.01 | Implementar filtros, orden estable, paginación y totales en SQL parametrizado con alcance de servidor. | Conserva límite/contrato de página y semántica aprobada; no se pagina una carga completa en memoria. | Pendiente |
| S2-03.03 | 1 | S2-03.02 | Implementar detalle por farmacia/producto y joins que preservan producto sin fila de stock. | Stock nulo se conserva donde el producto existe; inexistente/fuera de alcance no filtra información. | Pendiente |
| S2-03.04 | 1 | S2-03.03 | Resolver cero, nulos, sin lote, sin registro, fecha civil y errores de entrada/dependencia. | No hay equivalencia falsa con cero, lote adicional o stock mínimo; errores del contrato correctos. | Pendiente |
| S2-03.05 | 1 | S2-03.04 | Contrastar página, total, summary y detalle con consultas/recuentos de referencia. | Datos coinciden; total de productos y número de registros stock se distinguen; sin doble conteo. | Pendiente |

### S2-04 — Conectar la UI interna al backend real

**Epic:** E04/E05 · **Prioridad:** P0 · **Total:** 8 h  
**Ventana:** 12–16/11  
**Dependencias del bloque:** G1; S2-01/02/03; alcance UI/contratos autorizado

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S2-04.01 | 2 | S2-01; S2-03 | Integrar rutas internas/guards de experiencia, shell y acceso desde la landing; mantener guard efectivo en backend. | Landing sigue pública y UI interna requiere sesión; no renombra rutas por accidente. | Pendiente |
| S2-04.02 | 2 | S2-04.01 | Componer proveedor HTTP sobre InventoryRepository, con cancelación y manejo de errores. | El recorrido final consulta NestJS; el mock deja de ser el proveedor de esa composición, sin fallback automático. | Pendiente |
| S2-04.03 | 2 | S2-04.02 | Integrar filtros, paginación y detalle conservando URL, atrás y contexto/foco. | Las rutas actuales abren detalle directo y vuelven al listado correcto; permisos repetidos en API. | Pendiente |
| S2-04.04 | 2 | S2-04.03 | Completar carga/vacío/error/sin permiso/expiración y limpiar resultados al cambiar cuenta o sucursal. | Caída de API/BD no muestra datos sintéticos; no quedan respuestas viejas de otro alcance. | Pendiente |

### S2-05 — Verificar integración y límites de acceso

**Epic:** E03/E09 · **Prioridad:** P0 · **Total:** 6 h  
**Ventana:** 16–17/11  
**Dependencias del bloque:** S2-01 a S2-04

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S2-05.01 | 2 | S2-04 | Probar consultas y contrato contra PostgreSQL de prueba; comparar claves, filas y agregados. | QA-05/06 con dataset identificable y origen persistido; mocks no acreditan integración. | Pendiente |
| S2-05.02 | 1 | S2-05.01 | Manipular token, sucursal e IDs por llamada directa, incluyendo detalle y metadatos. | QA-02/03/04: ninguna lectura de sucursal ajena ni identidad desconocida habilitada. | Pendiente |
| S2-05.03 | 1 | S2-05.02 | Probar filtros inválidos/extremos, orden, ausencia de datos y rechazo de escritura en entorno local. | QA-08/12: límites efectivos, SQL parametrizado y credencial habitual sin escritura de negocio. | Pendiente |
| S2-05.04 | 1 | S2-05.03 | Ejecutar recorrido de navegador, error de conexión, expiración y cambio de usuario/sucursal. | QA-07/08: estados claros, foco/contexto y cache aislados; no fallback a demo. | Pendiente |
| S2-05.05 | 1 | S2-05.04 | Corregir defectos dentro del alcance, repetir casos afectados y clasificar pendientes. | Sin defectos bloqueantes/altos del recorrido; evidencia de corrección, no solo de primera ejecución. | Pendiente |

### S2-06 — Aceptar inventario y cerrar alcance de S3

**Epic:** E05/E09 · **Prioridad:** P0 · **Total:** 3 h  
**Ventana:** 17/11  
**Dependencias del bloque:** S2-05 y criterios G2 cumplidos

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S2-06.01 | 1 | S2-05 | Demostrar acceso/inventario y contrastar datos; solicitar revisión y registrar G2. | G2 aceptado o En revisión/Bloqueado con causa; demo declara origen local/remoto real. | Pendiente |
| S2-06.02 | 1 | S2-06.01 | Actualizar contrato, guía y handoff con casos de uso, permisos y resultados propios. | Otro desarrollador puede reproducir el recorrido y distinguir pruebas pasadas de pendientes. | Pendiente |
| S2-06.03 | 1 | S2-06.02 | Recalcular reserva/restante y fijar P1 incluidos o retirados antes de S3. | Alcance del 17/11 registrado; P0 tiene prioridad sobre los 11 h de ampliaciones. | Pendiente |

## Salida y aceptación

- G2 objetivo: **17/11**, paquete 0.2.0 de consulta integrada.
- Usuario de A accede a A y no a B, incluso por URL/API/detalle/metadatos; identidad desconocida denegada.
- Listado, detalle y total coinciden con la referencia; cero, nulo, sin stock y sin lote permanecen distintos.
- Errores de conexión y sesión se manejan sin inventar datos; pruebas QA-02 a QA-08 y QA-12/15 verificadas.
- Sin cambios académicos ni escrituras de negocio. Estado de integración remota se informa por separado.
- Si falta G2, S3 se dedica al P0 pendiente; no se construye dashboard sobre consultas no aceptadas.

## Control de horas

| Bloque | Prioridad | Horas |
|---|---|---:|
| S2-01 | P0 | 6 |
| S2-02 | P0 | 5 |
| S2-03 | P0 | 6 |
| S2-04 | P0 | 8 |
| S2-05 | P0 | 6 |
| S2-06 | P0 | 3 |
| **Total tareas** | | **34** |
| Reserva separada | | 8 |
| Capacidad bruta | | 42 |

La reserva cubre coordinación, bloqueos y correcciones fuera de la estimación; no agrega funciones. Registrar cada consumo. Los controles detallados y casos QA del plan completo también aplican a cada bloque correspondiente.

## Registro de avance y evidencia

| Fecha | ID | Estado | Tiempo real / restante | Versión y entorno/dataset | Evidencia, decisión o bloqueo |
|---|---|---|---|---|---|
| Por registrar | — | Pendiente | — | — | No hay ejecución funcional acreditada por esta tabla. |

## Registro de reserva y cambios

| Fecha | Motivo | Horas de reserva consumidas | Reserva restante | Cambio de alcance/decisión |
|---|---|---:|---:|---|
| Inicio | Reserva inicial | 0 | 8 | Sin cambios. |

No retirar un P0 ni cambiar una regla de seguridad sin acuerdo del propietario. Las decisiones de aceptación, permisos y cambios de calendario quedan registradas con su fecha.

