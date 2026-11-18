# Sprint 1 — Base, contratos y landing

[Índice](README.md) · [Reglas](REGLAS-DE-EJECUCION.md) · [Plan completo](../VITAFARMA-PLAN-RELEASE-Y-SPRINTS-2026.md)

**Fechas de 2026:** 28 de octubre–6 de noviembre  
**Capacidad bruta:** 48 h · **Plan:** 38 h · **Reserva:** 10 h  
**Responsable de todas las subtareas:** desarrollador principal. Apoyo ocasional solo para revisión; no es dependencia obligatoria.

## Objetivo y entrada

Confirmar la base de DevOps, cerrar contratos y entorno aislado y entregar la landing pública antes de construir nueva UI interna.

Entrada: copia/raíz confirmadas, instrucciones vigentes y autorización delimitada para cada bloque de implementación. El trabajo de diseño espera elección antes de código; los servicios locales y nuevas dependencias requieren su alcance específico.

## Secuencia prevista

- 28–29/10: contexto, fuentes, contratos y decisiones.
- 29–30/10: base y G0; completar lo faltante sin rehacer DevOps.
- 30/10–02/11: entorno/dataset/Auth local aprobados.
- 03–04/11: landing, una vez elegida su composición.
- 05–06/11: verificación, documentación y G1.

## Todas las tareas y subtareas

Estado inicial de cada fila: **Pendiente**. Cambiar la última columna al trabajar y añadir evidencia en el registro inferior. No marcar completada una función por existir un mock o una prueba histórica. Las horas de las subtareas suman las del bloque: no sumarlas dos veces. Las esperas de aprobación tienen 0 h de esfuerzo y pueden desplazar fechas.

### S1-01 — Confirmar base DevOps y propiedad de archivos

**Epic:** E01 · **Prioridad:** P0 · **Total:** 2 h  
**Ventana:** 28/10  
**Dependencias del bloque:** Instrucciones vigentes y copia local accesible

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S1-01.01 | 1 | Inicio | Leer reglas, índice, arquitectura, manifiestos y estado de Git; inventariar cambios ajenos. | Fuentes y raíz identificadas; cambios ajenos anotados sin tocarlos. | Terminada |
| S1-01.02 | 1 | S1-01.01 | Recibir handoff de DevOps y acordar base, carpetas responsables y estado del experimento. | Handoff y acuerdo de áreas registrados; no se inicia otra reorganización. | Terminada |

### S1-02 — Contrastar modelo académico y necesidades de consulta

**Epic:** E01 · **Prioridad:** P0 · **Total:** 4 h  
**Ventana:** 28–29/10  
**Dependencias del bloque:** S1-01 y documentos actuales

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S1-02.01 | 1 | S1-01 | Identificar snapshot, SQL académico y documentación; registrar versión/hash y fecha de verificación remota histórica. | Fuentes diferenciadas; ningún script ejecutado ni afirmación de remoto actualizado. | Terminada |
| S1-02.02 | 1 | S1-02.01 | Revisar claves, nulos, farmacia/producto, lote y especializaciones; confirmar ausencia de stock. | Mapa de claves y casos cero/nulo/sin fila/sin lote documentado. | Terminada |
| S1-02.03 | 1 | S1-02.02 | Separar restricciones críticas, errores del llenado y mejoras; revisar DATE y atribución de sucursal de ventas. | Límites funcionales de §2.2 del plan confirmados o corregidos con fuente. | Terminada |
| S1-02.04 | 1 | S1-02.03 | Mapear cada dato mínimo de pantalla y métrica a campos/relaciones; excluir columnas privadas. | Diccionario de lectura por caso y brechas explícitas; ninguna columna nueva supuesta. | Terminada |

### S1-03 — Cerrar contratos y decisiones de integración

**Epic:** E01/E03 · **Prioridad:** P0 · **Total:** 3 h  
**Ventana:** 29/10  
**Dependencias del bloque:** S1-01 y S1-02

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S1-03.01 | 1 | S1-02 | Registrar decisión de persistencia y Auth, manteniendo stack, capas, módulos y lockfile actuales. | Una propuesta de driver/proveedor y sus permisos/dependencias; sin instalarlos. | Terminada |
| S1-03.02 | 1 | S1-03.01 | Diseñar evolución de puertos asíncronos/paginados y contratos HTTP; enumerar consumidores y pruebas afectados. | Impacto de metadata(), rows(), InventoryQueries, parser, controlador y contratos revisable; aprobación requerida identificada. | Terminada |
| S1-03.03 | 1 | S1-03.02 | Definir matriz de identidad/perfil/sucursal, fuentes administradas y procedencia del dataset; presentar las decisiones pendientes. | Matriz revisada con el propietario o bloqueada explícitamente; desconocidos denegados por defecto. | Terminada |

### S1-04 — Revalidar y completar el arranque existente

**Epic:** E01 · **Prioridad:** P0 · **Total:** 5 h  
**Ventana:** 29–30/10  
**Dependencias del bloque:** Base estable DevOps, S1-03 y alcance local autorizado

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S1-04.01 | 2 | S1-03 | Revalidar arranque y comprobaciones de la base existente según DEVELOPMENT, sin recrear workspaces. | Scripts reales identificados y resultados propios registrados; ahorro frente al plan pasa a reserva. | Terminada |
| S1-04.02 | 1 | S1-04.01 | Delimitar configuración de integración, health y errores seguros; implementar solo ajustes autorizados. | Demo/desconexión no se presenta como disponibilidad de BD; configuración inválida no habilita acceso ficticio. | Terminada |
| S1-04.03 | 1 | S1-04.02 | Revisar comandos raíz y CI disponible; proponer o aplicar únicamente la parte expresamente autorizada. | Sin segunda configuración ni cambio CI/CD tácito; faltantes y permisos registrados. | Terminada |
| S1-04.04 | 1 | S1-04.03 | Documentar arranque, parada, requisitos y fallos conocidos de la base que se reutiliza. | G0: base coherente y responsabilidad de pendientes; no se copian resultados históricos como nuevos. | Terminada |

### S1-05 — Preparar entorno local aislado y dataset persistido

**Epic:** E01/E03 · **Prioridad:** P0 · **Total:** 6 h  
**Ventana:** 30/10–02/11  
**Dependencias del bloque:** S1-02/03/04; permiso explícito de dependencias, servicios y destino local

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S1-05.01 | 1 | S1-03; S1-04 | Especificar servicios, destino local, bootstrap, cambios de configuración y dependencias; obtener alcance autorizado. | Destino desechable y permiso identificados; si falta aprobación, la tarea dependiente queda bloqueada. | Terminada |
| S1-05.02 | 2 | S1-05.01 | Preparar los servicios aprobados y restaurar el baseline local identificado; usar privilegios separados de bootstrap/aplicación. | Host/base comprobados como locales; esquema académico remoto intacto; sin carga masiva destructiva. | Terminada |
| S1-05.03 | 1 | S1-05.02 | Cargar dataset de prueba local con categorías, dos sucursales y casos semánticos válidos. | Datos persistidos, origen y regeneración documentados; nulabilidad real respetada. | Terminada |
| S1-05.04 | 1 | S1-05.02 | Configurar Auth local aprobado y perfiles de prueba administrados; separar identidad de usuario académico. | Identidad de prueba emitida, mapeo de servidor reconocible y ningún vínculo estructural inventado. | Terminada |
| S1-05.05 | 1 | S1-05.03; S1-05.04 | Probar lectura local, estado de servicios y aislamiento de secretos/destinos; documentar recuperación. | Una consulta real y verificación de identidad locales; sin credenciales ni acceso remoto. | Terminada |

### S1-06 — Proponer, aprobar e implementar la landing

**Epic:** E02 · **Prioridad:** P0 · **Total:** 10 h  
**Ventana:** 03–04/11; depende de la aprobación humana  
**Dependencias del bloque:** S1-03/04; brief, referencias y procedimiento de diseño

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S1-06.01 | 1 | S1-03; S1-04 | Leer brief/referencias y reglas de diseño; delimitar contenido, rutas y componentes existentes reutilizables. | Contenido veraz; Inter/Inter Tight y tokens vigentes identificados; ninguna UI editada aún. | Terminada |
| S1-06.02 | 1 | S1-06.01 | Presentar tres composiciones distintas, referencias directas, secciones, motion plan, riesgos y archivos concretos. | Propuesta revisable de concepto y alcance; máximo tres patrones de movimiento y alternativa reducida. | Terminada |
| S1-06.03 | 0 | S1-06.02 | Esperar elección y aprobación explícitas de concepto, pantalla y alcance de archivos. | Registrar la decisión del propietario; el silencio no desbloquea implementación. | Terminada |
| S1-06.04 | 4 | S1-06.03 | Construir solo la landing aprobada, reutilizando UI/fuentes y separando el acceso público de la demo interna. | Secciones aprobadas y navegación funcional; sin cifras falsas, nuevos paquetes o alteraciones internas fuera de alcance. | Terminada |
| S1-06.05 | 3 | S1-06.04 | Ajustar móvil/tablet/escritorio, CTA y estados; enlazar solo destinos disponibles. | 360/768/1280 px utilizables; contacto solo validado y ningún formulario que aparente enviar. | Terminada |
| S1-06.06 | 1 | S1-06.05 | Revisar implementación frente a concepto y contenido aprobado; preparar evidencia para QA. | Sin cambios de negocio/Auth/SQL por una tarea de UI; lista de verificaciones y pendientes. | Terminada |

### S1-07 — Verificar landing y corregir defectos

**Epic:** E02/E09 · **Prioridad:** P0 · **Total:** 4 h  
**Ventana:** 05/11  
**Dependencias del bloque:** S1-06 aceptada para revisión

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S1-07.01 | 1 | S1-06 | Probar navegación de teclado, foco, enlaces y lectura de controles. | QA-01: recorrido sin bloqueo; registrar resultados reales. | Terminada |
| S1-07.02 | 1 | S1-07.01 | Inspeccionar 360/768/1280 px y capturar solo las vistas efectivamente revisadas. | Sin desbordamiento global o contenido esencial recortado; evidencia con versión. | Terminada |
| S1-07.03 | 1 | S1-07.02 | Revisar contraste, movimiento reducido y ausencia de secretos/datos internos en la landing. | QA-11 público revisado; animación no impide acceder a contenido. | Terminada |
| S1-07.04 | 1 | S1-07.03 | Corregir defectos del alcance aprobado y repetir su comprobación; registrar los que excedan el bloque. | Fallos de recorrido resueltos; restantes clasificados y sin afirmar validaciones pendientes. | Terminada |

### S1-08 — Documentar, demostrar G1 y preparar S2

**Epic:** E01/E09 · **Prioridad:** P0 · **Total:** 4 h  
**Ventana:** 06/11  
**Dependencias del bloque:** S1-04/05/07

| Subtarea | h | Depende de | Trabajo ejecutable | Cierre verificable | Estado |
|---|---:|---|---|---|---|
| S1-08.01 | 1 | S1-04; S1-05 | Actualizar guía de ejecución local y entorno/dataset, sin secretos. | Otro revisor dispone de pasos y límites; no hay SQL remoto como paso de arranque. | Terminada |
| S1-08.02 | 1 | S1-07; S1-08.01 | Dejar handoff de base, decisiones, contratos, permisos y pruebas pendientes. | Siguiente sesión puede ubicar el trabajo sin depender del historial de chat. | Terminada |
| S1-08.03 | 1 | S1-08.02 | Demostrar landing y arranque según el instructivo; solicitar revisión G1 y registrar resultado. | G1 aceptado o En revisión/Bloqueado con causa; no asumir aprobación. | Terminada |
| S1-08.04 | 1 | S1-08.03 | Registrar horas reales, reserva, ausencias y estimación de S2; resolver dependencias listas. | Capacidad y fechas revalidadas; ninguna tarea interna empieza sin G1 y permiso correspondiente. | Terminada |

## Salida y aceptación

- G1 objetivo: **06/11**, paquete 0.1.0 de landing y base local; no implica tag/publicación.
- Landing veraz, funcional en los tres tamaños y con teclado; sin información interna ni cifras de mock.
- Contratos y límites del modelo revisados; local aislado reproducible y lectura/identidad comprobables.
- Elegir concepto y registrar aceptación son decisiones humanas. Si G1 queda pendiente, no se inicia la UI interna dependiente.
- Ver criterios completos de G1, DoD y QA-01/11/13/15 en el plan principal.

## Control de horas

| Bloque | Prioridad | Horas |
|---|---|---:|
| S1-01 | P0 | 2 |
| S1-02 | P0 | 4 |
| S1-03 | P0 | 3 |
| S1-04 | P0 | 5 |
| S1-05 | P0 | 6 |
| S1-06 | P0 | 10 |
| S1-07 | P0 | 4 |
| S1-08 | P0 | 4 |
| **Total tareas** | | **38** |
| Reserva separada | | 10 |
| Capacidad bruta | | 48 |

La reserva cubre coordinación, bloqueos y correcciones fuera de la estimación; no agrega funciones. Registrar cada consumo. Los controles detallados y casos QA del plan completo también aplican a cada bloque correspondiente.

## Registro de avance y evidencia

| Fecha | ID | Estado | Tiempo real / restante | Versión y entorno/dataset | Evidencia, decisión o bloqueo |
|---|---|---|---|---|---|
| 18/11/2026 | S1-01, S1-02 | Terminada | Trabajo de la sesión; 0 h restantes de estos bloques | Base de DevOps y login `2a39370` | Se identificaron workspaces, módulos, áreas de edición y materiales locales ajenos. [Fuentes, diccionario y límites por pantalla](INTEGRACION-Y-TRABAJO-4.md). |
| 18/11/2026 | S1-03 | En revisión | Pendiente decisión del propietario; 1 h planificada para la matriz | Misma revisión | Contrato paginado, consumidores de ambos repositorios y matriz propuestos. Los perfiles locales de práctica no conceden acceso al Supabase académico. |
| 18/11/2026 | S1-04 | Terminada | 0 h restantes de este bloque | `998ff2d`, Node 22.23.3, npm 10.9.9 | Tras instalar el lockfile, tipos, lint y build pasaron. La base inicial pasó 3 pruebas de arquitectura, 11 de backend y 41 de navegador; la revisión de disponibilidad pasó 14 de backend. Arranque raíz observado: web 200, salud 200, disponibilidad de consultas 503 en modo demo; Ctrl+C liberó ambos puertos. No había workflow versionado de CI. |
| 18/11/2026 | S1-05, S1-08.01 | Terminada | 0 h restantes de estas actividades | `ba61267`, VF-PRACTICA-1, PostgreSQL y Auth locales | [Entorno reproducible](../architecture/ENTORNO-LOCAL.md), rol lector y 3 identidades. PostgreSQL devolvió 10 y 3 filas de stock en las sucursales 1 y 2 respectivamente. Se verificaron firma, identidad, aislamiento y cierre de sesión. [Prueba del login en Chromium](../SUPABASE-LOGIN.md). |
| 18/11/2026 | S1-06.01–03 | En revisión | Elección: 0 h; construcción, ajuste y revisión: 8 h planificadas | Propuesta, sin pantalla nueva | [Tres composiciones, referencias, archivos y pruebas](INTEGRACION-Y-TRABAJO-4.md). Se pidió al propietario elegir la portada. La captura del login existente no es evidencia de la landing. |
| 18/11/2026 | G1 | Bloqueada | Pendientes landing, QA y aceptación | Entorno de práctica verificado | El trabajo técnico anterior se integró como incremento parcial. La aceptación del sprint queda en manos del propietario después de revisar la portada funcionando. |

Las horas de esfuerzo humano efectivo no se cronometraron. Las horas restantes indicadas proceden de las estimaciones originales y no implican consumo de toda la capacidad del día.

## Aceptación G1 · 18/11/2026

El propietario eligió Mostrador VitaFarma, autorizó el contrato de lectura y la matriz por sucursal y aceptó expresamente **la portada y la base local** después de revisar las capturas. El 18/11 reemplaza la fecha prevista del 06/11 como fecha efectiva de G1. La disponibilidad prevista hasta el 27/11 es de ocho jornadas de 6 h. El registro histórico anterior conserva las decisiones que estaban abiertas antes de esta aceptación.

Portada de la revisión `ae84f1a`: ruta pública sin solicitudes internas con Auth caído o sin configurar, acceso al login, enlace de salto, foco de teclado y movimiento reducido. Evidencia de la misma implementación en [móvil](evidencias/portada-360.png), [tableta](evidencias/portada-768.png) y [escritorio](evidencias/portada-1280.png). La imagen editorial ilustra el mostrador. La matriz y el destino para las operaciones de la Parte II se aceptaron el mismo día: sucursales asignadas por identidad, PostgreSQL local para práctica y Supabase académico reservado a un futuro lector dedicado.

## Registro de reserva y cambios

| Fecha | Motivo | Horas de reserva consumidas | Reserva restante | Cambio de alcance/decisión |
|---|---|---:|---:|---|
| Inicio | Reserva inicial | 0 | 10 | Sin cambios. |

No retirar un P0 ni cambiar una regla de seguridad sin acuerdo del propietario. Las decisiones de aceptación, permisos y cambios de calendario quedan registradas con su fecha.

