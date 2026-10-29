# Decisiones de la base

Fecha: 28/10/2026. El usuario aprobó la arquitectura propuesta y la opción A en conversación.

| Decisión | Motivo y consecuencia |
| --- | --- |
| Un backend NestJS modular | Misma tecnología de referencia que UMSSY, con límites explícitos por dominio; una unidad de ejecución |
| Conservar React/Vite | Existe un piloto funcional; no se migra a Next.js por usarlo el proyecto de referencia |
| npm workspaces | Mantiene el gestor del piloto y centraliza instalación, contratos y comandos |
| Un lockfile raíz | Se migran las resoluciones del lockfile original como base; se elimina el lockfile anidado |
| Contratos sin framework | Frontend y backend acuerdan proyecciones sin compartir persistencia o secretos |
| Un módulo por dominio | Nueve límites con responsabilidad sobre las 27 tablas; no una carpeta CRUD por tabla |
| Inventario como ejemplo vertical | Demuestra capas, inyección y errores; los otros módulos no fingen operaciones implementadas |
| API e interfaz con demos independientes | El frontend mantiene su autonomía; la API ofrece un ejemplo pequeño identificable por cabecera y salud |
| Sin ORM o conexión de BD en esta fase | No generar migraciones ni reinterpretar el modelo académico; persistencia real se decide aparte |
| Inter + Inter Tight | Opción A aprobada; se adopta la tipografía de UMSSY conservando la composición operativa y los colores |
| Documentos originales en su ruta | Conserva referencias del equipo; el índice distingue vigencia y antecedentes |

## Tipografía y movimiento

Inter 400/500/600 para interfaz; Inter Tight 700/800 para títulos y marca. Se incluye 500
porque el piloto ya lo utiliza en controles. Las fuentes se empaquetan con Fontsource
y se sirven localmente, sin peticiones a Google Fonts durante el uso.

Se conservan verde `#0B4937`, fondo `#F6F8F5`, texto `#19362D`, selección `#DCE9DC`,
advertencia `#805714`, error `#A52A32` y foco `#345AB4`. Se mantienen espaciado base de
4 px, radios de controles de 7 px y de paneles de 12 px.

| Disparador | Elemento / duración | Utilidad | Movimiento reducido |
| --- | --- | --- | --- |
| Abrir detalle o navegación móvil | Panel, 220 ms | Conservar contexto | Sin desplazamiento animado |
| Cambiar pestaña | Indicador, 160 ms | Continuidad de selección | Cambio inmediato |
| Filtrar o usar controles | Feedback, 120 ms | Confirmar interacción | Transición inmediata |

No se agregan animaciones de filas, contadores o entradas en cascada.

## Referencias

- UMSSY local: `D:/UMSS/6to Semestre/IS/umssy-app/frontend/src/app/layout.tsx`
  y `globals.css`, inspeccionados para familias, pesos y escala; no se copian colores ni módulos.
- [Inter](https://fontsource.org/fonts/inter) y [Inter Tight](https://fontsource.org/fonts/inter-tight): fuentes y licencia OFL.
- [Módulos NestJS](https://docs.nestjs.com/modules): encapsulación y exportaciones.
- [Workspaces npm](https://docs.npmjs.com/cli/v11/using-npm/workspaces/): paquetes locales.
- [Transacciones node-postgres](https://node-postgres.com/features/transactions): referencia para la fase de persistencia; no es una dependencia instalada.
- [Pulse Clinic](https://dribbble.com/shots/27699617-Pulse-Clinic-Counter-to-Supplier-Pharmacy-Dashboard-Animation)
  y [Oripio](https://dribbble.com/shots/26765569-Pharmacy-Website): antecedentes visuales. Se consultaron las páginas, no se reprodujeron animaciones.
