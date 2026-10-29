# VitaFarma — Reglas de ejecución de los sprints

Estado: reglas de trabajo documentadas para el plan de noviembre de 2026. Complementan las instrucciones vigentes del propietario y no conceden permisos de implementación. Véanse el [índice](README.md) y el [plan completo](../VITAFARMA-PLAN-RELEASE-Y-SPRINTS-2026.md).

## 1. Precedencia y fuentes de verdad

1. Instrucciones vigentes del propietario y alcance explícitamente autorizado.
2. Reglas del proyecto e instrucciones aplicables al área que se va a editar.
3. Código real, [arquitectura](../architecture/ARCHITECTURE.md), [decisiones](../architecture/DECISIONS.md) y encabezado vigente del [brief UI](../UI-DESIGN-BRIEF.md).
4. Esquema remoto observado con permiso como referencia técnica de BD; scripts académicos como modelo presentado. El [snapshot local](../schema-supabase-actual.sql) y [DB-CONTEXT](../DB-CONTEXT.md) registran una versión, no una comprobación actual del remoto.
5. Plan de release y tableros de sprint para organizar trabajo futuro.
6. Propuestas y decisiones anteriores como antecedentes; nunca como permisos permanentes.

Si dos documentos se contradicen, registrar la diferencia antes de implementar y aplicar la instrucción vigente más específica. No sobrescribir antecedentes ni interpretar placeholders antiguos como anulación de una decisión posterior.

## 2. Autorización y límites

- La orden de incorporar tasks/reglas/tiempos autoriza documentación local. No autoriza ejecutar las tareas funcionales, instalar, crear BD ni conectar a remoto.
- Antes de implementar un bloque, explicitar objetivo, archivos/áreas, contratos afectados, dependencias nuevas, verificaciones y acciones de entorno. Solicitar el permiso que falte para ese bloque concreto.
- Una autorización cubre sus ediciones y correcciones rutinarias dentro del alcance descrito. No pedirla de nuevo para cada archivo ya incluido.
- Si aparece una dependencia, librería, flujo o archivo adicional fuera del alcance aprobado, detener esa parte y solicitar ampliación específica. Continuar el trabajo independiente ya autorizado.
- No ejecutar `git add`, commit, push, merge, PR, deploy ni publicación de artefactos sin permiso explícito. «Documentos guardados en el repo local» no significa «publicados en GitHub».
- No modificar `.env`, secretos, acceso, permisos o CI/CD sin autorización. Una tarea que los menciona sigue siendo un plan.
- Las pruebas y comandos se ejecutan solo en destinos autorizados. No ejecutar scripts destructivos ni comandos de BD por conveniencia.

## 3. Reglas de base de datos

1. Conservar tablas, columnas, PK/FK, relaciones, datos y scripts académicos. No rediseñar el modelo para acomodar una UI.
2. No crear ni modificar triggers, funciones SQL o migraciones académicas durante estos sprints. Las operaciones transaccionales quedan fuera de la release.
3. No ejecutar migraciones, INSERT, UPDATE, DELETE, TRUNCATE o DROP en Supabase sin aprobación explícita. No ejecutar carga masiva o reset para arrancar la app.
4. Toda propuesta estructural futura identifica problema, objetos, solución mínima, compatibilidad, riesgos y migración SQL revisable. No ejecutarla al redactarla.
5. Separar inconsistencias críticas, mejoras opcionales y errores de llenado; no convertir una diferencia del seed en un cambio de esquema automático.
6. Un entorno local debe tener nombre/destino comprobados, baseline identificado y datos sintéticos o copia aprobada. Su creación/restauración también requiere autorización del bloque local.
7. Usar permisos efectivos mínimos para la conexión habitual; no desarrollar la app con `postgres` remoto como atajo. La API no modifica datos académicos.
8. Conservar diferencia entre cero, nulo, ausencia de stock y ausencia de lote; no inventar stock mínimo, múltiples saldos por lote ni horas donde solo hay DATE.
9. La lectura SQL de NestJS no hereda automáticamente la identidad Auth. Cada petición aplica permisos y alcance en el servidor.
10. No activar Data API, RLS, grants ni Auth remoto por seguir un tutorial. Primero revisar el estado y obtener permiso para la operación concreta.

## 4. Arquitectura y contratos

- Conservar monolito NestJS/TypeScript, React/Vite, npm workspaces, un lockfile y contratos sin framework. No rehacer la reorganización de DevOps.
- Respetar capas existentes y `public.ts`. Dominio no depende de framework; aplicación no importa adaptadores; presentación valida y llama a casos de uso; infraestructura implementa puertos.
- Usar los nueve módulos registrados: `branches`, `catalog`, `inventory`, `suppliers`, `sales`, `staff`, `access`, `audit`, `reports`. El dashboard pertenece a `reports`; no crear otro dominio duplicado.
- Enumerar consumidores antes de cambiar contratos compartidos o props de componentes y aprobar el impacto. No importar persistencia del backend desde el frontend.
- El puerto demo de inventario carga filas completas y usa metadatos síncronos. Diseñar su evolución a paginación/filtrado real en servidor antes de acoplar un driver.
- Conservar rutas actuales `/inventario` en UI y `/api/v1/inventory` en API salvo cambio explícitamente aprobado; una traducción en un documento no renombra una API.
- Las funciones reales consumen BD a través de NestJS. Los mocks pueden conservarse como experimento o soporte de pruebas aisladas, sin fallback ni selección accidental en el build final aceptado.
- No añadir servicios independientes, colas o infraestructura distribuida para este alcance.

## 5. Diseño y aprobación

Antes de una pantalla nueva o rediseño, leer el [brief](../UI-DESIGN-BRIEF.md) y las [referencias animadas](../REFERENCIAS-ANIMADAS.md). Revisar intención visual, reutilización de componentes, rendimiento React y accesibilidad. La documentación técnica oficial y las decisiones del proyecto guían la implementación.

Flujo de la landing:

1. Explorar en solo lectura rutas, estilos, dependencias, contenido, estado de Git y componentes reutilizables.
2. Presentar tres direcciones realmente distintas, referencias directas explicadas, mapa de secciones, archivos propuestos, riesgos y motion plan.
3. Esperar elección y alcance explícitos. La espera es un hito de 0 h, con posible efecto en calendario.
4. Implementar solo la ruta/área elegida y autorizada; no extender la aprobación a API, Auth o SQL.
5. Verificar la UI real y documentar resultados, capturas observadas y pendientes.

Se conservan Inter/Inter Tight y tokens actuales; no inferir nueva identidad de plantillas antiguas. Elegir como máximo tres patrones útiles de movimiento para el piloto, con alternativa reduced motion. No fabricar testimonios, contacto, cifras operativas o servicios clínicos.

## 6. Coordinación y ritmo

- Una tarea de implementación en curso por persona; cada archivo tiene un responsable durante el bloque.
- El desarrollador principal implementa; el apoyo ocasional revisa en lectura. Si ambos escriben, separar ramas/checkouts y áreas con autorización y coordinación.
- No borrar, mover o reemplazar archivos del experimento o trabajo ajeno sin permiso. Registrar cambios ajenos presentes en Git sin tocarlos.
- Máximo 6 h diarias previstas, sin fines de semana comprometidos. Recalcular ante clases/feriados/ausencias.
- No sumar bloques con sus subtareas. La estimación incluye las verificaciones y documentación indicadas.
- Si un bloqueo dura más de 2 h, registrarlo y tomar una tarea independiente lista. Si una tarea supera 50 % de su estimación, reestimar.
- Retirar historial comercial y después proveedores antes de comprometer P0 o seguridad. La reserva no habilita nuevas funciones.

## 7. Definición de listo

Una subtarea está lista cuando tiene objetivo, prioridad, horas, dependencia disponible, criterio de cierre, fuente de datos/contrato, archivos/área coordinados y permiso que cubre sus acciones. Si falta un permiso o dependencia, marcar `Bloqueada` y decir qué falta; no simularla con mocks.

## 8. Definición de terminado

1. Cumple su criterio y los del bloque padre; resultado probado sobre una revisión y dataset identificables.
2. Pasan tipos, lint y build aplicables; pruebas focalizadas en reglas/errores de riesgo e integración con BD cuando corresponde.
3. Backend valida entrada, identidad, perfil y alcance en listado, detalle y agregados; no expone secretos o campos innecesarios.
4. UI incluye carga, vacío, error, sin permiso/expiración y datos ausentes; teclado, foco y tamaños acordados verificados.
5. No hay cambio académico, entorno remoto o configuración fuera del permiso.
6. Contrato, guía y handoff relevantes actualizados; evidencia real adjunta.
7. Sin defectos bloqueantes/altos. Los menores admitidos tienen impacto, responsable y decisión explícita.

No exigir pruebas que solo repitan una edición documental o cosmética. Para cambios solo de documentación comprobar enlaces, coherencia, horas y alcance del diff; no ejecutar la aplicación o la BD sin necesidad.

## 9. Evidencia, aceptación y continuidad

Formato mínimo de evidencia: `ID → revisión → entorno/dataset → fecha → resultado → captura/log/referencia → defecto`. Usar `No ejecutado` o `Bloqueado` si corresponde. No afirmar que se vio una pantalla o animación sin inspeccionarla; no reciclar las pruebas previas de DevOps como pruebas nuevas.

Al terminar una sesión registrar tarea, archivos afectados, decisión, pruebas/resultados, permisos aplicables, horas reales/restantes, bloqueo y siguiente subtarea. Mantener ese registro en el tablero del sprint; crear un handoff adicional solo si hace falta y está autorizado.

G1, G2 y G3 necesitan aceptación explícita. Si el propietario aún no revisó, marcar `En revisión`; el silencio no es aprobación. La release requiere todos los P0 terminados, P1 incluidos o retirados, documentación, regresión y seguridad verificadas. Publicarla exige permiso separado.

## 10. Severidad y recortes

| Severidad | Ejemplo | Regla de salida |
|---|---|---|
| Bloqueante | Fuga de secretos, lectura de otra sucursal, modificación académica no autorizada | Detener la entrega afectada, corregir y repetir la comprobación; no publicar. |
| Alta | Login/consulta central inutilizable, total incorrecto, pérdida de contexto que impide trabajar | Corregir antes de aceptar el MVP. |
| Media/baja | Defecto visual menor o mejora fuera del recorrido crítico | Registrar impacto y decisión de aceptación/planificación, sin ocultarlo. |

No retirar autorización, integridad de datos o pruebas críticas para sostener una fecha. Si falta P0 el 27/11, informar entrega parcial y acordar cambio de alcance o fecha.
