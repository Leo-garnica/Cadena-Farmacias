# UI Design Brief — Cadena-Farmacias · v2

## Decisión vigente · 28/10/2026

El usuario aprobó **opción A: Mesa de control**, conservando composición, colores y
recorrido de Inventario, y adoptando **Inter para interfaz e Inter Tight para títulos**
como en UMSSY. Alcance: inventario existente en sus dos rutas, reorganización modular,
backend base y contratos; no nuevas pantallas operativas ni conexión real.

Se conservan panel 220 ms, tabs 160 ms y feedback 120 ms, con movimiento reducido.
Ver [decisiones y referencias](architecture/DECISIONS.md) y
[comprobaciones de entrega](architecture/IMPLEMENTATION.md).

La plantilla que sigue se conserva como antecedente; sus campos POR CONFIRMAR no
anulan esta aprobación. Los roles y permisos reales continúan pendientes.

> **Documento editable por el equipo, NO diseño definitivo.** Se identificó el nombre del proyecto, pero **no se ha inspeccionado su código real**. Los campos `POR CONFIRMAR` deben completarse con información del repositorio; las propuestas de paleta y animación son conceptos opcionales.

## 0. Estado de decisión
- Responsable de aprobación de UI: `POR CONFIRMAR`
- Fecha / sprint / alcance: `POR CONFIRMAR`
- Pantalla/ruta piloto: `POR CONFIRMAR`
- Estado del concepto: **PENDIENTE DE ELECCIÓN**
- Diseño anterior obligatorio de conservar: `POR CONFIRMAR`
- Convenciones de equipo / ramas: `POR CONFIRMAR`

## 1. Qué producto estamos diseñando
- Función real de Cadena-Farmacias: `POR CONFIRMAR (leer README, rutas y casos de uso)`
- Usuarios reales y permisos (ejemplo no vinculante: administrador, caja, personal de almacén): `POR CONFIRMAR`
- Los 3 trabajos más frecuentes que debe resolver la pantalla: `POR CONFIRMAR`
- Datos críticos: `POR CONFIRMAR` (inventario, lotes, ventas, reportes **solo si el sistema ya los contempla**)
- Problemas concretos de la pantalla existente: `POR CONFIRMAR`
- Tamaños/dispositivos prioritarios: `POR CONFIRMAR`; revisar inicialmente móvil 360, tablet 768, desktop 1280+
- Restricciones de accesibilidad, rendimiento, conectividad, navegadores: `POR CONFIRMAR`

## 2. Lo existente manda
- Stack UI real: `POR CONFIRMAR` (no suponer React, Tailwind, Vite ni Next.js)
- Framework de estilos/componentes ya instalado: `POR CONFIRMAR`
- Archivo(s) de tema/tokens existentes: `POR CONFIRMAR`
- Logo, colores, iconos y tipografía que no deben alterarse: `POR CONFIRMAR`
- Rutas/componentes compartidos y tests actuales: `POR CONFIRMAR`
- APIs, roles, validación y flujos que deben permanecer intactos: `POR CONFIRMAR`

## 3. Tres direcciones artísticas para debatir (NO elegidas)

### Opción A — Botica editorial / precisión cálida
- Carácter: tipografía estructurada, aire editorial, fondo cálido, jerarquía nítida.
- Propuesta de colores **solo como muestra**: tinta `#172326`, fondo `#F7F6F1`, verde `#287B68`, acento miel `#C98943`, superficie `#FFFFFF`.
- Distintivo: cabeceras de sección a modo de índice, encabezados con líneas editoriales y jerarquía sin una cuadrícula de tarjetas repetidas.
- Motion potencial: entrada progresiva discreta de secciones en pantallas públicas; cambios de estado rápidos en el panel.
- Riesgo: si hay muchas tablas, una composición demasiado editorial dificulta el escaneo.

### Opción B — Centro de operaciones farmacéuticas (prioridad de exploración, NO aprobado)
- Carácter: sistema informativo de alta legibilidad, líneas de estado, barra de comandos, tablas y filtros precisos.
- Propuesta de colores **solo como muestra**: fondo `#F3F6F6`, tinta `#12292B`, verde petróleo `#166F70`, alerta `#B75531`, superficie `#FFFFFF`.
- Distintivo: navegación por tareas, encabezados contextuales, módulos compactos y códigos visuales semánticos sin saturación.
- Motion potencial: filtros con transición de resultados, paneles que se abren sin perder contexto, confirmaciones de guardado.
- Riesgo: evitar que demasiada densidad resulte abrumadora.

### Opción C — Sistema modular / ciencia accesible
- Carácter: retícula modular personalizada, identidad geométrica e ilustraciones propias SOLO cuando aporten utilidad.
- Propuesta de colores **solo como muestra**: noche `#173033`, crema `#F0F4EE`, turquesa `#23A695`, azul claro `#D9E9EB`, acento coral `#D77764`.
- Distintivo: patrón modular de información y pequeños indicadores explicativos, no cubos ni hero SaaS genérico.
- Motion potencial: cambio de módulos, resaltado contextual de cambios de datos y estados de proceso.
- Riesgo: moderar formas decorativas en pantallas de uso intensivo.

**Ninguna paleta o tipografía queda autorizada por aparecer aquí.** Se debe comprobar contraste y compatibilidad con la identidad vigente. Si se fijan fuentes, revisar licencias y fuentes ya disponibles; no descargar automáticamente.

## 4. Animación y experiencia (decidir ANTES de implementar)
- Referencias curadas y enlaces: `docs/REFERENCIAS-ANIMADAS.md`.
- Diseño de movimiento: revisar [referencias animadas](REFERENCIAS-ANIMADAS.md) y documentar disparador, utilidad y alternativa de movimiento reducido.
- Elegir 1 referencia como **dirección visual**, 1 como **comportamiento de dashboard**, 1 como **microinteracción**; no mezclar todo.
- Motion que resuelve tareas: confirmación de guardado, apertura de panel, cambio de filtro, estados de tabla, desplazamiento de contexto.
- Motion no deseado en operaciones: entradas en cascada cada visita, scroll artificial, parallax en tablas, números que se animan mientras deben leerse, sonidos automáticos.
- Grado elegido: `[ ] mínimo  [ ] equilibrado  [ ] expresivo para páginas públicas`
- Preferencia de movimiento reducido: ofrecer alternativa estática o transiciones casi instantáneas.

## 5. No negociables
- No introducir cambios de dominio para conseguir un layout visual.
- No inventar existencia de productos, ventas, pacientes, farmacias, alertas ni cifras reales; mocks deben ir etiquetados.
- No modificar endpoints, migraciones, SQL, autenticación ni credenciales por una petición de UI.
- No instalar paquetes ni reemplazar librerías sin aprobación previa.
- No hacer commits, pushes ni despliegues automáticos.
- Evitar interfaz de IA genérica: tarjetas repetidas, gradientes morados de relleno, exceso de sombras, iconografía arbitraria y dashboards decorativos.

## 6. Criterios de aceptación de la pantalla piloto
- [ ] Se inspeccionó el repositorio y se resumieron la pantalla y sus flujos reales.
- [ ] Mostró **3 rutas claramente diferentes** con 3 referencias y plan de motion.
- [ ] El responsable marcó concepto elegido: `POR CONFIRMAR`.
- [ ] Se aprobó explícitamente lista de archivos y alcance.
- [ ] Se mantienen sin cambios las funciones y permisos existentes.
- [ ] Se probaron vista móvil, tablet y escritorio cuando las herramientas lo permitan.
- [ ] Foco visible, contraste, etiquetas, estados y `prefers-reduced-motion`.
- [ ] Animaciones informan sin bloquear ni ralentizar tareas.
- [ ] Diff pequeño, comprensible, sin commit ni push no autorizados.

## 7. Acta de elección (completar después de revisar los enlaces)
| Decisión | Elección aprobada | Motivo | Responsable |
| --- | --- | --- | --- |
| Pantalla piloto | POR CONFIRMAR | | |
| Dirección A / B / C o mezcla controlada | POR CONFIRMAR | | |
| Referencia visual principal | POR CONFIRMAR | | |
| Referencia animación funcional | POR CONFIRMAR | | |
| Paleta/tipografía | POR CONFIRMAR | | |
| Animación permitida/prohibida | POR CONFIRMAR | | |
| Fecha de aprobación | POR CONFIRMAR | | |
