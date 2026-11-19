# Documentación de VitaFarma

| Para qué | Documento |
| --- | --- |
| Abrir la aplicación en el equipo | [Inicio y modos de práctica](../README.md) |
| Preparar la defensa del Trabajo 4, Parte II | [Informe con capturas y consultas](trabajo-4/README.md) · [PDF para imprimir](trabajo-4/VitaFarma-interfaces.pdf) |
| Ver qué se aceptó y cómo repetir las pruebas | [Cierre de los tres sprints](planning/CIERRE-RELEASE-2026.md) |
| Entrar con un perfil y revisar sus sucursales | [Acceso del personal](SUPABASE-LOGIN.md) |
| Recorrer la portada, el inventario, los indicadores y los formularios | [Guía del frontend](../frontend/README.md) |
| Preparar PostgreSQL y Auth locales, verificar los datos de control y recuperar los servicios | [Entorno local](architecture/ENTORNO-LOCAL.md) |
| Desarrollar y comprobar cambios | [Guía de desarrollo](architecture/DEVELOPMENT.md) |
| Revisar el contrato HTTP, permisos y transacciones | [API de lectura](../backend/README.md) · [Gestión del Trabajo 4](../backend/src/modules/sales/README.md) |
| Entender el monolito, sus contratos y el reparto de 27 tablas | [Arquitectura](architecture/ARCHITECTURE.md) · [Módulos](architecture/MODULES.md) · [Contratos](../packages/contracts/README.md) |
| Revisar las pruebas y decisiones de octubre | [Decisiones iniciales](architecture/DECISIONS.md) · [Entrega de la base DevOps](architecture/IMPLEMENTATION.md) |

## Release de noviembre de 2026

El [plan de release](VITAFARMA-PLAN-RELEASE-Y-SPRINTS-2026.md) recoge prioridades, dependencias, riesgos, alcance y capacidad. Los estados y evidencias por tarea se registran en el [índice de planificación](planning/README.md) y los [tableros de ejecución](planning/REGLAS-DE-EJECUCION.md).

| Sprint | Fechas | Capacidad original | Entrega |
| --- | --- | --- | --- |
| [1](planning/SPRINT-1.md) | 28/10–06/11 | 38 h de tareas + 10 h de reserva | Base local y portada. |
| [2](planning/SPRINT-2.md) | 09/11–17/11 | 34 h de tareas + 8 h de reserva | Acceso y consultas por sucursal. |
| [3](planning/SPRINT-3.md) | 18/11–27/11 | 38 h de tareas + 10 h de reserva | Indicadores, gestión de práctica y cierre. |

La capacidad inicial considera un desarrollador a 6 h diarias de lunes a viernes, con 138 h brutas y 28 h de reserva. El propietario retiró las ampliaciones de proveedores e historial comercial general para priorizar indicadores y Parte II del Trabajo 4. La práctica mantiene un registro de sus propias ventas. [Trazabilidad de la integración](planning/INTEGRACION-Y-TRABAJO-4.md)

## Referencias del modelo y de la interfaz

| Documento | Uso y vigencia |
| --- | --- |
| [Diccionario de datos](DB-CONTEXT.md) | Análisis del modelo y observaciones sobre el proyecto académico del 25/10/2026. |
| [Snapshot PostgreSQL](schema-supabase-actual.sql) | Referencia de las relaciones, columnas y restricciones académicas. |
| [SQL académico](../Scripts/farmacia_crebas.sql) | Modelo presentado. |
| [Llenado masivo](<../Scripts/llenado_masivo_farmacia_bolivia_realista (1).sql>) | Generador histórico del proyecto. |
| [Brief UI](UI-DESIGN-BRIEF.md) · [Referencias de movimiento](REFERENCIAS-ANIMADAS.md) | Antecedentes de composición, tipografía y movimiento del equipo. |
