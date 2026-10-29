# VitaFarma — Planificación y seguimiento

Vigencia: 28/10–27/11/2026. Equipo: un desarrollador principal, 6 h al día de lunes a viernes; apoyo ocasional sin compromiso de capacidad. Estado inicial: planificación incorporada; ejecución funcional pendiente de autorización por bloque.

## Documentos de trabajo

| Documento | Para qué sirve |
|---|---|
| [Plan completo de release y sprints](../VITAFARMA-PLAN-RELEASE-Y-SPRINTS-2026.md) | Alcance, arquitectura, epics, prioridades, backlog por módulos, riesgos, pruebas, aceptación y estrategia local/Supabase. |
| [Reglas de ejecución](REGLAS-DE-EJECUCION.md) | Permisos, fuentes de verdad, coordinación, diseño, definición de listo/terminado y evidencia. |
| [Sprint 1 — Base y landing](SPRINT-1.md) | Todas las tareas y subtareas del 28/10 al 06/11; 38 h planificadas. |
| [Sprint 2 — Acceso e inventario](SPRINT-2.md) | Todas las tareas y subtareas del 09/11 al 17/11; 34 h planificadas. |
| [Sprint 3 — Dashboard y release](SPRINT-3.md) | Todas las tareas y subtareas del 18/11 al 27/11; 38 h planificadas, con 11 h P1 retirables. |

## Calendario y capacidad

| Sprint | Fechas de 2026 | Días de lunes a viernes | Capacidad | Tareas | Reserva | Hito |
|---|---|---:|---:|---:|---:|---|
| 1 | 28/10–06/11 | 8 | 48 h | 38 h | 10 h | G1: landing y base local |
| 2 | 09/11–17/11 | 7 | 42 h | 34 h | 8 h | G2: inventario integrado |
| 3 | 18/11–27/11 | 8 | 48 h | 38 h | 10 h | G3: MVP aceptado |
| **Total** | **28/10–27/11** | **23** | **138 h** | **110 h** | **28 h** | |

Las 110 h se distribuyen en 21 bloques: 99 h P0 esenciales y 11 h P1 de ampliaciones. Los tableros desglosan esos mismos bloques en 86 subtareas; **no sumar las horas del bloque con las de sus subtareas**. Una subtarea de aprobación con 0 h representa un hito de espera humana, no una aprobación automática.

No se cuentan fines de semana. Registrar clases, feriados y ausencias: cada día no disponible reduce 6 h; no se compensa suponiendo ayuda o trabajo nocturno. La reserva cubre coordinación, incertidumbre y correcciones, no nuevas funciones.

## Orden de producto

1. Confirmar la base DevOps y contratos, sin rehacer la arquitectura existente.
2. Proponer, aprobar y entregar la landing pública.
3. Integrar identidad/permisos y consultas reales mediante NestJS/PostgreSQL.
4. Aceptar inventario antes de construir el dashboard de indicadores.
5. Consolidar pruebas, seguridad, documentación y aceptación; añadir proveedores/comercial solo si P0 está encaminado.

El MVP de noviembre es de **consulta**. Registrar ventas, descontar stock, facturar, gestionar personal y desarrollar triggers quedan en el backlog posterior. El [plan completo](../VITAFARMA-PLAN-RELEASE-Y-SPRINTS-2026.md) conserva el backlog de todos los módulos y la razón de cada exclusión.

## Punto de partida observado

- npm workspaces: `frontend`, `backend`, `packages/contracts`; un lockfile raíz.
- React/Vite y NestJS ya existen. Se conserva `domain/application/infrastructure/presentation`, las entradas `public.ts` y los nueve módulos registrados.
- La raíz web redirige a `/inventario`. El frontend usa su propio mock y no consume la API demo; la API utiliza otro corpus sintético y declara BD desconectada.
- Auth, permisos por sucursal, persistencia PostgreSQL, landing y dashboard real están pendientes.
- Inter/Inter Tight y la paleta actual constan en el brief vigente; la composición nueva de landing todavía requiere aprobación.
- El snapshot local enumera 27 tablas. No se comprobó de nuevo Supabase remoto. No confundir documentación, carga masiva y datos realmente desplegados.
- El experimento de inventario se conserva para evaluar reutilización, sin presentarlo como integración real aceptada de esta release.

La [entrega de arquitectura](../architecture/IMPLEMENTATION.md) registra pruebas de una fase previa. No equivalen a haber probado la integración futura ni se han repetido para esta incorporación documental.

## Cómo usar los tableros

1. Leer las [reglas operativas](REGLAS-DE-EJECUCION.md), las decisiones vigentes y el sprint activo.
2. Elegir una única subtarea lista, con su dependencia y alcance autorizado.
3. Cambiar su estado a `En curso`. Estados permitidos: `Pendiente`, `Lista`, `En curso`, `En revisión`, `Bloqueada`, `Terminada`, `Retirada`.
4. Al cerrar, enlazar evidencia y anotar tiempo real. No usar `Terminada` si falta aceptación o prueba crítica.
5. Mantener los IDs del bloque y subtarea. Un cambio de horas se explica y se refleja en el total del sprint y el plan principal.
6. Para retirar P1, registrar motivo y decisión; sus horas pasan a estabilidad/reserva, no a otra función improvisada.

Todas las subtareas comienzan `Pendiente`, incluso cuando hay componentes o pruebas previas reutilizables: sus criterios de aceptación para esta release aún deben verificarse. El trabajo de redactar estos documentos no completa tareas funcionales.

## Decisiones y permisos aún necesarios

| Decisión | Momento | Qué habilita |
|---|---|---|
| Confirmar handoff/base DevOps y alcance de archivos | S1-01 | Reutilizar la base con un responsable por área. |
| Elegir persistencia, proveedor Auth y matriz perfil/sucursal | S1-03 | Contratos, permisos y dependencias de la integración. |
| Autorizar servicios/destino local, bootstrap y dependencias | Antes de S1-05 | Crear un entorno aislado sin apuntar al académico remoto. |
| Elegir concepto de landing y archivos concretos | S1-06.03 | Implementar la nueva pantalla pública. |
| Aprobar impacto de contratos compartidos/puertos | S1-03 y S2-03.01 | Migrar de lectura en memoria a consulta asíncrona paginada. |
| Autorizar lectura remota y credencial mínima, si se necesita | Antes de cualquier acceso a Supabase | Verificación remota acotada; no cambios de esquema. |
| Aceptar G1, G2 y G3 | 06/11, 17/11 y 27/11 | Registrar cada incremento como aceptado. |

Guardar el plan no autoriza esas operaciones ni equivale a aprobar conceptos futuros. La instrucción actual del propietario autoriza solo esta incorporación documental; no commit, push, deploy, cambios de BD o ejecución de los sprints.
