# Sprint 3 — Dashboard, consolidación y release

[Índice](README.md) · [Reglas](REGLAS-DE-EJECUCION.md) · [Plan completo](../VITAFARMA-PLAN-RELEASE-Y-SPRINTS-2026.md)

**Fechas de 2026:** 18–27 de noviembre  
**Capacidad bruta:** 48 h · **Plan:** 38 h · **Reserva:** 10 h  
**Responsable de todas las subtareas:** desarrollador principal. Apoyo ocasional solo para revisión; no es dependencia obligatoria.

## Objetivo y entrada

**Cierre efectivo · 18/11/2026.** El propietario aceptó G2 y, tras revisar indicadores y una venta confirmada, aceptó el dashboard y las interfaces locales del Sprint 3. El [acta de entrega](CIERRE-RELEASE-2026.md) reúne las comprobaciones del candidato. Las fechas siguientes son las ventanas originales.

Completar dashboard de lectura verificable, consolidar seguridad y entregar el MVP reproducible. Proveedores e historial comercial son P1 retirables: no sostienen el camino crítico.

Entrada: G2 aceptado, sin fallos bloqueantes, alcance cerrado el 17/11 y capacidad real revisada. Todos los cambios funcionales/visuales/entorno deben estar autorizados; P1 necesita capacidad y permiso, no solo aparecer en el tablero.

## Secuencia prevista

- 18–19/11: indicadores y dashboard real.
- 19–20/11: proveedores si procede; revisión de alcance el 20/11.
- 23–24/11: historial comercial si sigue siendo viable; congelación funcional **24/11**.
- 24–25/11: revisión de seguridad y candidato **25/11**.
- 25–27/11: regresión, documentación, UAT y G3. Después del candidato, solo correcciones/documentación indispensables.

## Todas las tareas y subtareas

La última columna muestra el resultado de cada subtarea. Las horas son estimaciones del plan y las de cada bloque incluyen sus subtareas.

### S3-01 — Construir dashboard con métricas verificables

**Epic:** E06 · **Prioridad:** P0 · **Total:** 6 h  
**Ventana:** 18–19/11  
**Dependencias del bloque:** G2 aceptado; S2-03/05/06; alcance de dashboard aprobado

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S3-01.01 | 1 | G2 | Definir hasta tres indicadores con fórmula, alcance, filtros, fecha de referencia y casos nulos. | Especificación sustentada: registros de stock, cantidad cero, lote asociado vencido; sin stock mínimo ni unidades por lote inventadas. | Terminada |
| S3-01.02 | 2 | S3-01.01 | Implementar proyecciones/agregados dentro de reports mediante interfaces públicas y SQL acotado. | Permisos de sucursal aplicados; sin tablas nuevas ni duplicación del módulo reports. | Terminada |
| S3-01.03 | 2 | S3-01.02 | Construir dashboard aprobado y enlaces al inventario filtrado con estados de carga/error. | Muestra datos reales de consulta; no cifra estática, gráfico innecesario ni cambio visual fuera del alcance. | Terminada |
| S3-01.04 | 1 | S3-01.03 | Contrastar métricas con referencia, joins duplicadores y fechas ayer/hoy/mañana. | QA-09/10: coincidencia por filtro antes de paginar; DATE sin desplazamiento de zona. | Terminada |

### S3-02 — Proveedores en consulta — ampliación retirable

**Epic:** E07 · **Prioridad:** P1 · **Total:** 5 h  
**Ventana:** 19–20/11, solo con P0 encaminado  
**Dependencias del bloque:** S2-02/05; S3-01 estable; permiso y capacidad P1 confirmados

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S3-02.01 | 1 | S2-06; S3-01 | Acordar campos, permisos y contrato de directorio/relación proveedor-producto. | Alcance reducido sin escritura; si no hay capacidad/autorización, bloque retirado. | Retirada |
| S3-02.02 | 2 | S3-02.01 | Implementar consulta paginada y detalle mínimo en suppliers usando persistencia. | Relación compuesta respetada; resultados reales y mínimos; sin compras/recepciones ficticias. | Retirada |
| S3-02.03 | 1 | S3-02.02 | Implementar listado/detalle y estados autorizados de UI. | Navegación funcional y contenido permitido; sin rutas de relleno. | Retirada |
| S3-02.04 | 1 | S3-02.03 | Probar datos, permisos, vacío/error y cerrar documentación de la ampliación. | QA-14 pasa y DoD completa; de lo contrario, módulo omitido de la release. | Retirada |

### S3-03 — Historial comercial — ampliación retirable

**Epic:** E08 · **Prioridad:** P1 · **Total:** 6 h  
**Ventana:** 23–24/11, solo si sigue siendo viable  
**Dependencias del bloque:** S1-02; S2-01/02/05; P1 confirmado y alcance comercial aprobado

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S3-03.01 | 1 | S2-06; S1-02 | Verificar relación de venta/sucursal, semántica histórica y campos permitidos. | Si no se demuestra un alcance seguro, retirar P1; no presentar sucursal derivada como histórica inmutable. | Retirada |
| S3-03.02 | 2 | S3-03.01 | Implementar historial/detalle de lectura dentro de sales, paginado y con alcance. | Sin registrar venta, factura o receta ni actualizar stock; columnas personales reducidas. | Retirada |
| S3-03.03 | 1 | S3-03.02 | Construir UI mínima autorizada y fecha civil, sin controles de venta inexistentes. | Historial y detalle legibles; no inventa hora de operación ni emite documentos. | Retirada |
| S3-03.04 | 1 | S3-03.03 | Probar privacidad, sucursal, inexistente y correspondencia de cabecera/detalle. | QA-14 comercial con resultados de BD; sin acceso lateral ni exposición de receta/cliente innecesaria. | Retirada |
| S3-03.05 | 1 | S3-03.04 | Corregir y volver a verificar el alcance, o retirarlo si no cumple DoD al congelar. | Decisión de inclusión/retirada registrada; no módulo parcialmente disponible. | Retirada |

### S3-04 — Revisión de seguridad transversal

**Epic:** E09 · **Prioridad:** P0 · **Total:** 7 h  
**Ventana:** 24–25/11; controles preparados desde S2  
**Dependencias del bloque:** G2; S3-01 y cada P1 que se incluya

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S3-04.01 | 1 | S3-01; lista final P1 | Revisar secretos en código/bundle/logs y dependencias de producción. | QA-11 con versión candidata; sin claves SQL/secretas ni datos personales en evidencias. | Terminada |
| S3-04.02 | 2 | S3-04.01 | Repetir pruebas negativas de identidad/perfil/sucursal en listado, detalle, metadata y agregados. | No hay endpoint alternativo o agregado que exponga otro alcance; incluidos P1 si aplican. | Terminada |
| S3-04.03 | 1 | S3-04.02 | Revisar validación, paginación, timeouts, orígenes, límites y privilegios efectivos del entorno aprobado. | Sin escritura de negocio ni permisos heredados inesperados; no confundir CORS con autorización. | Terminada |
| S3-04.04 | 3 | S3-04.03 | Corregir fallos dentro del alcance y repetir los controles afectados; escalar cambios adicionales. | Cero bloqueantes/altos de seguridad; cambios de acceso/entorno solo con permiso explícito. | Terminada |

### S3-05 — Regresión, accesibilidad y rendimiento

**Epic:** E09 · **Prioridad:** P0 · **Total:** 6 h  
**Ventana:** 25–26/11  
**Dependencias del bloque:** S3-01/04; módulos finales congelados

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S3-05.01 | 1 | S3-04 | Verificar tipos, lint, build, contratos y arranque reproducible según el instructivo. | Resultados propios del candidato; sin acceso/reset remoto al reinstalar o arrancar. | Terminada |
| S3-05.02 | 2 | S3-05.01 | Ejecutar regresión API/BD/navegador sobre recorrido central y módulos P1 incluidos. | Casos funcionales y negativos del plan pasan; registrar revisión, dataset y evidencia. | Terminada |
| S3-05.03 | 1 | S3-05.02 | Inspeccionar teclado, foco, contraste, reduced motion y 360/768/1280 px. | Sin bloqueo de uso; capturas solo de vistas observadas; no se declara certificación automática. | Terminada |
| S3-05.04 | 1 | S3-05.03 | Medir listado/agregados con dataset y máquina identificados según objetivo del plan. | p95 medido con muestra y concurrencia documentadas; sin índices remotos nuevos para maquillar la cifra. | Terminada |
| S3-05.05 | 1 | S3-05.04 | Corregir defectos críticos del alcance y repetir casos; clasificar limitaciones de medición. | Sin fallos bloqueantes/altos abiertos; pendientes menores con impacto y decisión. | Terminada |

### S3-06 — Preparar paquete de entrega y reversión

**Epic:** E09 · **Prioridad:** P0 · **Total:** 5 h  
**Ventana:** 26–27/11  
**Dependencias del bloque:** Resultados S3-04/05; contratos finales

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S3-06.01 | 1 | S3-05 | Completar requisitos, guía de uso/arranque/parada/recuperación y origen del dataset. | Un revisor puede reproducir la demo sin credenciales compartidas ni scripts académicos de arranque. | Terminada |
| S3-06.02 | 1 | S3-06.01 | Actualizar contrato API, matriz de permisos y decisiones reales de integración. | Documentación coincide con rutas, campos y perfiles efectivamente implementados. | Terminada |
| S3-06.03 | 1 | S3-06.02 | Consolidar reporte QA/seguridad con casos, resultados y evidencias del candidato. | Distingue ejecutado, bloqueado y no ejecutado; no recicla el reporte anterior de DevOps. | Terminada |
| S3-06.04 | 1 | S3-06.03 | Preparar notas de release, lista P1, limitaciones y reversión de web/API sin rollback SQL. | Artefacto/revisión identificados; no crea tag, commit, push ni deploy sin permiso. | Terminada |
| S3-06.05 | 1 | S3-06.04 | Preparar guion de demo y checklist de aceptación del propietario. | Recorrido de 10–15 min reproducible, sin datos sensibles ni promesas de operación comercial. | Terminada |

### S3-07 — Aceptar G3 y registrar el cierre

**Epic:** E09 · **Prioridad:** P0 · **Total:** 3 h  
**Ventana:** 27/11  
**Dependencias del bloque:** S3-05/06 y candidato listo para revisión

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S3-07.01 | 1 | S3-06 | Realizar UAT/demo con propietario o entregar checklist para su revisión. | Respuesta y defectos registrados; si no hay revisión humana, estado En revisión. | Terminada |
| S3-07.02 | 1 | S3-07.01 | Resolver incidencias finales acotadas al permiso y repetir sus casos; escalar las que excedan la reserva. | Cambios comprobados, sin ampliar funciones al final ni ocultar fallos P0. | Terminada |
| S3-07.03 | 1 | S3-07.02 | Registrar aceptación G3, P1 incluidos/retirados, defectos menores admitidos y siguiente backlog. | MVP aceptado solo con todos los P0 y decisión del propietario; sin publicación automática. | Terminada |

## Salida y aceptación

### Interfaces del Trabajo 4 priorizadas por el propietario

Las 11 h originalmente previstas para los dos P1 se tratan como objetivo de planificación de la ampliación de práctica. El equipo no registró horas efectivas por subtarea. Esta distribución conserva las 38 h del sprint.

| Tarea | h previstas | Dependencia | Trabajo realizado y criterio de aceptación | Estado |
|---|---:|---|---|---|
| T4-01 | 1 | G1, autorización local | Preparar copia persistente separada con rol de escritura, marca de instalación y cuentas sintéticas. El escritor solo admite la práctica local. | Terminada |
| T4-02 | 2 | T4-01, G2 | Implementar ocho recursos con validación de campos, alcance y tratamiento de referencias existentes. | Terminada |
| T4-03 | 2 | T4-02, diseño interno aprobado | Conectar las tablas, formularios y selectores. Probar altas, edición y eliminación con confirmación. | Terminada |
| T4-04 | 2 | T4-01, T4-02 | Registrar ventas con múltiples líneas, controles de saldo y lote, precio histórico y reintento de operación. El detalle debe coincidir con el movimiento de stock. | Terminada |
| T4-05 | 2 | T4-03, T4-04 | Probar concurrencia, permisos y reversión en PostgreSQL. Verificar la selección de productos, confirmación y consulta de detalle en navegador. | Terminada |
| T4-06 | 2 | T4-05 | Documentar cada interfaz con filas verificables y preparar el informe imprimible de la Parte II. | Terminada |

[Informe y evidencia por recurso](../trabajo-4/README.md) · [Consultas de contraste](../trabajo-4/consultas.sql)

- G3 objetivo: **27/11**, paquete 1.0.0-mvp aceptado, sin commit/tag/deploy implícitos.
- Dashboard consistente con consultas de referencia; permisos aplicados a cada agregado.
- Todos los P0 completos; P1 terminado o retirado y menú acorde. Los 11 h P1 se liberan a estabilidad si hay retraso.
- QA-01 a QA-15 pertinentes pasan en el candidato; ningún fallo bloqueante/alto de seguridad o recorrido central.
- Entrega reproducible con guía, contrato, reporte, origen de datos, limitaciones y reversión sin cambios académicos.
- Aceptación humana registrada; si falta revisión o P0, informar candidato/entrega parcial, no release aceptada.
- Estado remoto explícito. Publicación requiere decisión y autorización aparte.

## Control de horas

| Bloque | Prioridad | Horas |
|---|---|---:|
| S3-01 | P0 | 6 |
| S3-02 | P1 | 5 |
| S3-03 | P1 | 6 |
| S3-04 | P0 | 7 |
| S3-05 | P0 | 6 |
| S3-06 | P0 | 5 |
| S3-07 | P0 | 3 |
| **Total tareas** | | **38** |
| Reserva separada | | 10 |
| Capacidad bruta | | 48 |

La reserva cubre coordinación, bloqueos y correcciones fuera de la estimación; no agrega funciones. Registrar cada consumo. Los controles detallados y casos QA del plan completo también aplican a cada bloque correspondiente.

## Registro de avance y evidencia

| Fecha | ID | Estado | Tiempo real / restante | Versión y entorno/dataset | Evidencia, decisión o bloqueo |
|---|---|---|---|---|---|
| 18/11/2026 | S3-01 | Bloqueada | Pendiente de G2 | Inventario inicial de demostración | Se documentaron tres fórmulas en el [diccionario](INTEGRACION-Y-TRABAJO-4.md). El dashboard necesita inventario conectado y aceptado. Proveedores e historial comercial quedan condicionados a P0 y capacidad disponible. |
| 18/11/2026 | S3-04 | Pendiente | Comprobación parcial reutilizable | Lockfile de `2a39370` | El registro de npm devolvió 0 avisos conocidos para el árbol de producción al ejecutar `npm audit --omit=dev`. Repetir sobre el candidato final junto con las verificaciones de permisos y alcance de las consultas. |
| 18/11/2026 | S3-01, S3-04, S3-05 | Terminada | Sin cronometraje / 0 h restantes | `637015c`, ambos modos de práctica | Indicadores contrastados con SQL y probados por teclado. Se corrigieron el historial de navegación, el ajuste a 360 px y la presentación de conflictos. Regresión, control de privilegios, rendimiento y resultados en el [acta](CIERRE-RELEASE-2026.md). |
| 18/11/2026 | S3-02, S3-03 | Retirada | 11 h previstas liberadas | Decisión del propietario | Retirar ambos módulos del MVP para priorizar dashboard y Trabajo 4. |
| 18/11/2026 | T4-01 a T4-06, S3-06 | Terminada | Sin cronometraje / 0 h restantes | Copia de gestión local | La venta 100060 se confirmó en pantalla y se verificó en cabecera, detalle y stock. El informe incorpora 24 capturas y las consultas de contraste. |
| 18/11/2026 | S3-07 / G3 | Terminada | Sin cronometraje / 0 h restantes | `637015c`, evidencias de Centro y Norte | El propietario respondió «Acepto el dashboard y las interfaces locales del Sprint 3». La consulta de la BD académica remota sigue supeditada a la entrega de un rol lector. |

## Registro de reserva y cambios

| Fecha | Motivo | Horas de reserva consumidas | Reserva restante | Cambio de alcance/decisión |
|---|---|---:|---:|---|
| Inicio | Reserva inicial | 0 | 10 | Sin cambios. |

No retirar un P0 ni cambiar una regla de seguridad sin acuerdo del propietario. Las decisiones de aceptación, permisos y cambios de calendario quedan registradas con su fecha.

