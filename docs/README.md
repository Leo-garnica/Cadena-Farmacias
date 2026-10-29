# Documentación de VitaFarma

## Leer en este orden

1. [Inicio del proyecto](../README.md): instalación, comandos y estado funcional actual.
2. [Arquitectura](architecture/ARCHITECTURE.md): estructura y reglas de dependencia.
3. [Módulos y tablas](architecture/MODULES.md): propiedad de las 27 entidades.
4. [Desarrollo](architecture/DEVELOPMENT.md): trabajo diario, pruebas y cómo ampliar módulos.
5. [Decisiones](architecture/DECISIONS.md): elecciones y límites de esta base.
6. [Entrega y comprobaciones](architecture/IMPLEMENTATION.md): cambios y evidencia de esta fase.

## Planificación vigente · 28/10–27/11/2026

Después de conocer la base, leer el [índice de planificación](planning/README.md) y las
[reglas de ejecución](planning/REGLAS-DE-EJECUCION.md). Esta documentación organiza
trabajo futuro autorizado por bloques; no acredita que la integración real ya exista.

| Documento | Alcance y tiempo |
|---|---|
| [Plan completo de release y sprints](VITAFARMA-PLAN-RELEASE-Y-SPRINTS-2026.md) | Epics, backlog por módulos, arquitectura objetivo, dependencias, aceptación, riesgos, seguridad y entornos. |
| [Sprint 1](planning/SPRINT-1.md) | 28/10–06/11: base/contratos y landing; 38 h de tareas + 10 h de reserva. |
| [Sprint 2](planning/SPRINT-2.md) | 09/11–17/11: acceso y consultas integradas; 34 h de tareas + 8 h de reserva. |
| [Sprint 3](planning/SPRINT-3.md) | 18/11–27/11: dashboard, consolidación y release; 38 h de tareas + 10 h de reserva. |

Capacidad confirmada: 6 h al día, de lunes a viernes, sin depender del apoyo ocasional.
Son 138 h brutas, 110 h planificadas y 28 h de reserva. Los 21 bloques se desglosan
en 86 subtareas; sus horas no se suman dos veces. Las ampliaciones P1 son retirables.
El dashboard con mocks permanece como experimento; la landing se acepta antes de la
nueva UI interna y la BD académica/triggers se conservan.

## Fuentes de datos

| Documento | Uso y vigencia |
| --- | --- |
| [DB-CONTEXT.md](DB-CONTEXT.md) | Análisis y diccionario. Metadatos remotos observados el 25/10/2026; sus afirmaciones de ausencia de aplicación pertenecen a esa fecha |
| [schema-supabase-actual.sql](schema-supabase-actual.sql) | Snapshot técnico local contrastado entonces; se conserva sin ejecutar ni modificar |
| [SQL académico](../Scripts/farmacia_crebas.sql) | Modelo presentado; se conserva |
| [Llenado masivo](<../Scripts/llenado_masivo_farmacia_bolivia_realista (1).sql>) | Generador histórico; no acredita el estado actual de Supabase ni reglas aprobadas |

Las inconsistencias críticas, los problemas del llenado y las mejoras opcionales
siguen separados en DB-CONTEXT. La arquitectura no los da por resueltos.

## Diseño y antecedentes

| Documento | Uso |
| --- | --- |
| [Brief UI](UI-DESIGN-BRIEF.md) | Decisión actual al inicio; la plantilla original se conserva debajo |
| [Referencias animadas](REFERENCIAS-ANIMADAS.md) | Galería de inspiración; no implica funcionalidad ni dependencias aprobadas |
| [Frontend](../frontend/README.md) | Recorridos, estados y datos del inventario |
| [Backend](../backend/README.md) | Endpoints demo y composición |
| [Contratos](../packages/contracts/README.md) | Campos públicos compartidos y evolución |

Se mantienen las rutas originales de los documentos para conservar enlaces e
instrucciones del equipo. Los nuevos documentos de arquitectura se agrupan en
`architecture/`; este índice evita mezclar planes históricos con implementación actual.
