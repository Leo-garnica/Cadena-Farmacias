# VitaFarma — Plan de release y de tres sprints

**Periodo:** 28 de octubre–27 de noviembre de 2026  
**Versión del plan:** 1.1 · incorporada al repositorio el 28/10/2026  
**Zona horaria:** America/La_Paz  
**Equipo:** 1 desarrollador principal, con apoyo ocasional de otra persona  
**Disponibilidad confirmada:** 6 horas al día, de lunes a viernes  
**Destino previsto:** `docs/VITAFARMA-PLAN-RELEASE-Y-SPRINTS-2026.md`  
**Estado:** documentación autorizada e incorporada; base local contrastada en modo lectura; implementación funcional y cambios de entorno pendientes de autorización por bloque.

> El propietario autorizó incorporar el plan, las reglas y todas las tareas al repositorio. Esta entrega modifica únicamente documentación. No autoriza implementar la aplicación, ejecutar SQL, crear usuarios, cambiar permisos, instalar herramientas ni desplegar. No se ha accedido a la BD. Las tareas funcionales describen trabajo futuro sujeto al bloque que autorice el propietario.

**Para ejecutar y seguir el plan:** consultar el [índice de planificación](planning/README.md), las [reglas operativas](planning/REGLAS-DE-EJECUCION.md) y los tableros completos de [Sprint 1](planning/SPRINT-1.md), [Sprint 2](planning/SPRINT-2.md) y [Sprint 3](planning/SPRINT-3.md). Sus subtareas desglosan las horas de este documento: no son trabajo adicional.

## 1. Resultado que se busca

VitaFarma tendrá primero una landing pública y, después, una aplicación interna para consultar catálogo e inventario con información obtenida de PostgreSQL a través de una API NestJS. El backend será un monolito modular escrito en TypeScript. El proyecto debe poder instalarse, probarse y demostrarse de forma reproducible, con permisos aplicados en el servidor y sin alterar el esquema académico ni desarrollar sus triggers.

La primera versión integrada se prevé para el **17 de noviembre**. El cierre del MVP se fija como objetivo para el **27 de noviembre de 2026**, con una revisión de alcance a mitad del periodo. No se promete un sistema farmacéutico comercial completo en ese plazo.

El MVP comprometido cubre:

1. Landing pública de VitaFarma, adaptable y accesible, con contenido revisado.
2. Acceso interno mediante autenticación real y autorización por perfil y sucursal.
3. Consulta de sucursales y catálogo como soporte del inventario.
4. Inventario de solo lectura: búsqueda, filtros, paginación y detalle de producto/lote asociado.
5. Dashboard interno reducido, construido después del inventario y con indicadores verificables.
6. Entorno local aislado, pruebas, controles de seguridad y documentación de ejecución y entrega.

Las consultas de proveedores y del historial comercial son ampliaciones **P1**, retirables si la integración consume la reserva. Registrar ventas, modificar stock y administrar todas las entidades quedan fuera de esta release.

### 1.1 Qué significa «real» en esta release

- La aplicación consulta una BD PostgreSQL mediante NestJS; las pantallas finales no dependen de arreglos de mocks.
- En desarrollo y CI se permiten datos sintéticos **persistidos en una BD local aislada**, identificados como datos de prueba. Eso verifica integración, no acredita datos de una farmacia en operación.
- La demostración puede usar una copia académica autorizada. Su origen y fecha de extracción deben quedar visibles y documentados.
- La conexión al Supabase remoto es un hito condicionado a permiso y revisión de seguridad; no es un supuesto para poder desarrollar.
- Un MVP local aceptado no equivale a un servicio publicado ni a un producto habilitado para ventas reales.

## 2. Contexto, decisiones y límites

### 2.1 Base de información utilizada

Se revisaron los antecedentes de planificación y los documentos disponibles del proyecto. Al incorporar este plan se leyeron además las reglas, manifiestos, decisiones, contratos, rutas, adaptadores y documentación de la copia actual. Los antecedentes no conceden autorización vigente para implementar; la inspección local tampoco actualiza el estado remoto.

| Elemento | Tratamiento en este plan |
|---|---|
| Nombre VitaFarma | Confirmado por el propietario. |
| NestJS + TypeScript y monolito modular | Requisito actual. |
| Base de DevOps | Ya existe una reorganización documentada en `docs/architecture/`; confirmar su handoff y revalidar la base, no volver a crearla. |
| Dashboard anterior con mocks | Experimento no aprobado para esta release; no constituye avance aceptado. |
| Landing antes del dashboard | Orden obligatorio de entrega funcional. |
| 27 tablas | El snapshot SQL local contiene 27 tablas y coincide con la matriz de módulos documentada; los datos y el estado remoto no se han verificado de nuevo. |
| Data API desactivada; RLS/autenticación pendientes | Estado histórico referido; no se ha comprobado en remoto en esta entrega. |
| Triggers académicos pendientes | Fuera del alcance de implementación de este plan. No crearlos, sustituirlos ni anticiparlos. |
| React + TypeScript + Vite | Stack actual del frontend, con npm workspaces y contratos en `packages/contracts`. Se conserva. |
| Dirección visual | El brief vigente registra Mesa de control, Inter/Inter Tight y paleta verde. La composición de la landing aún requiere sus tres propuestas y aprobación; no se reabre la decisión del inventario por copiar el historial antiguo. |

El plan anterior proponía un piloto con mocks. Este documento cambia la planificación de producto y el orden de entrega. Las instrucciones y autorizaciones históricas no se reutilizan como permiso vigente.

**Estado local observado el 28/10:** `/` redirige a `/inventario`; el frontend compone `mockInventoryRepository`; la API declara `mode: demo`, `database: disconnected` y usa su propio adaptador sintético. No hay Auth ni adaptador PostgreSQL. Los documentos de DevOps registran una base previamente aprobada y sus comprobaciones; eso no convierte el dashboard demo en funcionalidad real aceptada de esta release. No se han vuelto a ejecutar esas pruebas en la incorporación documental.

### 2.2 Límites funcionales que deben verificarse antes de programar consultas

Los antecedentes señalan restricciones importantes:

- `stock` se identifica por farmacia/producto; un registro puede asociar un lote opcional. No asumir stock independiente por cada lote.
- No hay una regla confirmada de stock mínimo. «Cantidad cero» es distinto de «stock bajo» o «reponer».
- Algunos campos temporales de ventas y auditoría son fechas, no marcas de tiempo. No construir métricas por hora ni «hace cinco minutos» a partir de ellos.
- La sucursal de una venta podría derivarse del empleado y no representar un histórico inmutable.
- Una cantidad nula significa «No registrado»; no significa cero. La ausencia de una fila tampoco significa cantidad cero.
- No se ha demostrado que crear una venta descuente stock, genere factura y registre auditoría de forma atómica.

**Regla:** S1-02 debe confirmar o corregir cada punto contra los SQL/documentos vigentes. Si el modelo no permite una función, se reduce la función o se presenta una propuesta separada. No se modifica el esquema para acomodar una pantalla.

### 2.3 Alcance de las autorizaciones futuras

| Acción | Condición previa |
|---|---|
| Implementar código y documentación en el repositorio | Autorización del propietario para un bloque delimitado y coordinación con la base de DevOps. |
| Instalar dependencias o levantar servicios locales | Incluido expresamente en el alcance local autorizado; respetar herramientas ya elegidas por DevOps. |
| Crear/restaurar BD local y cargar datos de prueba | Autorizar un destino local desechable identificado; nunca usar por defecto una conexión remota. |
| Consultar Supabase remoto | Permiso que identifique proyecto, finalidad y alcance de lectura. |
| Crear roles de BD, cambiar grants/RLS/Auth o extraer una copia remota | Propuesta concreta, revisión y permiso explícito. Son cambios distintos de escribir la aplicación. |
| Modificar tablas, funciones, triggers o scripts académicos | Excluido; requiere una decisión nueva del propietario y del responsable académico. |
| Commit, push, merge o publicación | Según autorización expresa del propietario; el plan no la concede. |

Una autorización de desarrollo local puede abarcar todo un bloque y sus correcciones rutinarias. No hace falta volver a pedirla para cada archivo dentro de ese alcance. Si aparece una operación fuera del bloque, se prepara el cambio y su impacto para revisión antes de ejecutarlo.

## 3. Alcance de release y prioridades

### 3.1 Prioridades

| Prioridad | Significado | Tratamiento |
|---|---|---|
| P0 | Necesario para aceptar el MVP | Compromiso del plan; si falta, no se declara completa la release. |
| P1 | Valor adicional acotado | Se intenta solo con P0 encaminado y reserva suficiente; se puede retirar. |
| P2 | Posterior a noviembre | Se conserva en backlog sin fecha comprometida. |

### 3.2 Incluido, condicionado y diferido

| Área | P0 comprometido | P1 condicionado | P2 / fuera de la release |
|---|---|---|---|
| Web pública | Marca, presentación, capacidades, contacto validado o sección del proyecto, acceso interno al estar disponible | Directorio público si los datos están aprobados | Ecommerce, carrito, reservas, blog/CMS, campañas |
| Acceso | Login/logout, sesión expirada, identidad verificada, permisos por sucursal, denegación por defecto | Ninguno necesario | Registro público, panel completo de usuarios, múltiples proveedores de identidad |
| Sucursales | Selector y consulta de campos necesarios para inventario | Ficha ampliada | Altas, bajas y cambios |
| Catálogo | Búsqueda y detalle mínimo dentro del recorrido de inventario | Composición o relaciones adicionales si ya están disponibles | CRUD completo de catálogo y especializaciones |
| Inventario | Lectura, filtros, paginación, detalle, cero/nulo/lote ausente | Ninguno necesario | Ajustes, entradas/salidas, transferencias, stock mínimo y trazabilidad multilot |
| Dashboard | Hasta 3 indicadores sustentados y enlaces al inventario | Ninguno necesario | Gráficos sin pregunta funcional, predicciones, BI |
| Proveedores | Sin dependencia para el MVP | Directorio y relación producto/proveedor en consulta | Compras, recepciones, cambios de acuerdos |
| Comercial | Sin dependencia para el MVP | Historial de venta y detalle con alcance de sucursal verificable | Registrar ventas, facturación fiscal, recetas, cobros, caja, devoluciones |
| Personal | Solo relaciones necesarias para autorización si se validan | Ninguno necesario | Nómina, salarios, turnos y asignaciones como módulo operativo |
| Auditoría | Logs técnicos sin secretos y evidencia de pruebas | Ninguno necesario | Escribir en la tabla académica de auditoría o crear triggers de auditoría |

No se crearán pantallas de relleno para módulos futuros. El menú final mostrará únicamente rutas implementadas y permitidas. Los módulos P1 no terminados se desactivan u omiten por completo en la entrega.

### 3.3 Criterios de éxito del MVP

- Un visitante puede comprender el proyecto y recorrer la landing con teclado y móvil.
- Un usuario autorizado puede iniciar sesión, elegir una sucursal permitida y consultar una existencia concreta con su producto y lote asociado.
- Una petición anónima o fuera del alcance del usuario no obtiene información interna, incluso manipulando URL o llamando directamente a la API.
- Los resultados de inventario y los indicadores se pueden contrastar con consultas de referencia sobre el mismo conjunto de datos.
- El error de conexión produce un estado de error explícito, sin reemplazarse por mocks.
- Otra persona puede arrancar el entorno aprobado siguiendo la documentación y ejecutar la demostración.
- No se requieren cambios académicos ni credenciales privilegiadas en el navegador.

## 4. Capacidad, calendario y forma de trabajo

### 4.1 Presupuesto de horas

Se planifican **23 días de lunes a viernes × 6 h = 138 h brutas**. No se cuentan fines de semana ni horas del ayudante. No se han descontado clases, feriados ni compromisos personales: deben anotarse al arrancar; cada día no disponible reduce 6 h del total.

| Periodo | Fechas de 2026 | Días entre semana | Capacidad bruta | Tareas planificadas | Reserva |
|---|---|---:|---:|---:|---:|
| Sprint 1 | Mié. 28/10–vie. 06/11 | 8 | 48 h | 38 h | 10 h |
| Sprint 2 | Lun. 09/11–mar. 17/11 | 7 | 42 h | 34 h | 8 h |
| Sprint 3 | Mié. 18/11–vie. 27/11 | 8 | 48 h | 38 h | 10 h |
| **Total** | **28/10–27/11** | **23** | **138 h** | **110 h** | **28 h** |

Las 110 h incluyen implementación, pruebas, documentación y revisiones indicadas en las tareas. Las 28 h restantes cubren incertidumbre, coordinación, correcciones y bloqueos; no son capacidad vendida a nuevas funcionalidades. Del trabajo planificado, **99 h son P0 y 11 h son P1**. La reserva representa aproximadamente el 20 % de la capacidad bruta.

Las estimaciones son iniciales y presuponen que DevOps deja una base aprovechable y que el esquema permite las consultas descritas. Se reestiman al cerrar S1-02 y en cada revisión. Una estimación que exceda 6 h se divide en subtareas de 2–4 h, conservando el total y los criterios de aceptación.

### 4.2 Ritmo de una persona

- Máximo **una tarea de implementación en curso** y una revisión pendiente. No abrir varios módulos simultáneamente.
- Cada día: 10 minutos para escoger el siguiente bloque; tiempo principal para implementación/pruebas; 15 minutos para registrar avance y bloqueo. Ese tiempo entra en la reserva de coordinación.
- Trabajar por recorridos completos: contrato → consulta → API → pantalla → verificación. Evitar terminar primero todas las pantallas vacías.
- Revisión breve los viernes y cierre de sprint en su último día; actualizar estimación restante y alcance retirado.
- Si un bloqueo supera 2 h, registrar causa y pasar a la siguiente tarea independiente; no gastar el día esperando a DevOps o a permisos remotos.

### 4.3 Apoyo ocasional

El ayudante puede revisar la landing, ejecutar un guion de pruebas, probar el arranque en otra máquina, revisar accesibilidad o documentar defectos. Preparar entregas de 1–2 h que no requieran conocer toda la arquitectura.

Su disponibilidad **no desbloquea el camino crítico**. Si no participa, el desarrollador realiza las revisiones dentro de las horas ya previstas. Si participa, no se añade alcance automáticamente; se usa el tiempo ganado para reducir riesgo. Nunca entregar credenciales remotas por chat para facilitar una revisión.

### 4.4 Camino crítico y dependencias

```text
Entrega estable de DevOps + inventario del esquema
        ├──> base web/API + entorno local aislado
        │             └──> landing aceptada (G1)
        └──> contratos + matriz de permisos
                      └──> autenticación + API de consultas
                                  └──> inventario integrado aceptado (G2)
                                              └──> dashboard verificable
                                                        └──> regresión + UAT + G3

Inventario estable ──> proveedores / historial comercial (P1 retirables)
Permiso remoto + credenciales mínimas ──> comprobación Supabase remota (condicionada)
```

La landing debe estar aceptada antes de iniciar la UI interna del dashboard. La preparación del backend y de la seguridad sí puede avanzar en S1. Ninguna dependencia remota debe impedir demostrar el recorrido integrado contra la BD local aprobada.

## 5. Arquitectura objetivo

### 5.1 Decisiones técnicas

| Decisión | Propuesta para noviembre | Motivo / límite |
|---|---|---|
| Backend | NestJS + TypeScript, un proceso de aplicación | Mantener módulos claros sin coste de microservicios. |
| Persistencia | PostgreSQL local; Supabase como proveedor remoto condicionado | Respetar el modelo existente y aislar las pruebas. |
| Frontend | React + TypeScript + Vite, ya presentes | Conservar `frontend/src/app`, `modules` y `shared`; no migrar por la landing. |
| API | HTTP/JSON con contrato documentado y prefijo de versión | Permitir probar servidor e interfaz por separado. |
| Acceso a datos | Puertos ya existentes y adaptador PostgreSQL futuro por módulo | No hay driver ni ORM instalado para persistencia; elegir una solución en S1-03 y autorizar su instalación por separado. |
| Auth | Preferencia: Supabase Auth en entorno aislado + verificación en NestJS | No implementar un sistema casero de contraseñas ni confundir `auth.users` con `usuario`. |
| Esquema | Sin sincronización automática ni migración académica de aplicación | Cualquier ORM debe tener desactivadas las funciones que alteran tablas al iniciar. |
| Entrega | Artefacto web + API del monolito; ejecución local como base | Un frontend separado no convierte el backend en microservicios. Hosting se decide aparte. |

La documentación de NestJS define los módulos como límites de encapsulación y exportación de proveedores. Aquí se usarán para separar responsabilidades de dominio y exponer servicios concretos entre módulos. [Referencia: módulos de NestJS](https://docs.nestjs.com/modules).

### 5.2 Flujo y límites

```text
Visitante ──> Landing pública (contenido revisado, sin BD interna)

Usuario ──> Login con proveedor Auth aprobado
        └──> Web interna ──HTTP/token──> NestJS
                                         │
                              autenticación y permisos
                                         │
                            controlador → servicio → repositorio
                                         │
                           PostgreSQL local / Supabase autorizado
```

- El navegador no recibe contraseñas de PostgreSQL ni claves `service_role`/secretas.
- Toda lectura de datos internos pasa por NestJS. El SDK de Auth puede comunicarse con el proveedor para la sesión; no habilita consultas directas a tablas desde la UI.
- Los controladores validan entrada y salida; los servicios aplican permisos y reglas; los repositorios concentran SQL y mapeo.
- Los módulos consumen la interfaz pública de otro módulo. No importan sus repositorios privados ni duplican reglas de sucursal.
- Los DTO de API no exponen entidades completas, contraseñas, campos salariales, información clínica ni columnas que la pantalla no necesita.
- Las consultas que unan tablas de varios dominios se documentan dentro del módulo propietario del caso de uso; para informes se admiten proyecciones de lectura explícitas. No añadir un bus de eventos para resolver lecturas.
- No introducir Redis, colas, Kubernetes, CQRS, event sourcing ni una plataforma de microservicios para este MVP.

La base actual ya separa `domain/application/infrastructure/presentation` y expone `public.ts` por módulo. Se conservan esas capas y los nueve límites registrados. El dashboard futuro se ubica en `reports`, no en un nuevo módulo `indicadores` duplicado. Catálogo, sucursales y acceso se desarrollan dentro de `catalog`, `branches` y `access`. Los módulos reservados existentes no se borran ni se rellenan con CRUD ficticios.

### 5.3 Módulos y responsabilidad

| Módulo lógico | Responsabilidad | Entidades históricas orientativas | Dependencias |
|---|---|---|---|
| Acceso | Verificar identidad, resolver perfil y alcance de sucursales | `usuario`, `rol` solo si su relación se valida; proveedor Auth separado | Configuración; no depende de pantallas |
| Sucursales | Directorio interno y sucursales visibles | `ciudad`, `farmacia` | Acceso |
| Catálogo | Producto, categoría y detalle necesario | `producto`, `categoria`, `medicamento`, `laboratorio`, `monodroga`, `composicion` | Acceso |
| Inventario | Existencias por farmacia/producto y lote asociado | `stock`, `lote`; proyección de producto | Acceso, sucursales, catálogo |
| Indicadores | Resúmenes con las mismas reglas que inventario | Proyecciones de lectura | Inventario |
| Proveedores, P1 | Directorio y relación de suministro | `proveedor`, `producto_proveedor` | Acceso, catálogo |
| Comercial de consulta, P1 | Historial y detalle limitado | `venta`, `detalle_venta`; relaciones indispensables | Acceso, catálogo y relación de sucursal validada |
| Plataforma | Configuración, conexión, health, errores y logs | Sin tablas nuevas de negocio | Infraestructura |

Personal y administración completa quedan como límites futuros, no como módulos vacíos que deban implementarse ahora. La tabla no pretende enumerar las 27 tablas ni reemplazar el diccionario real.

### 5.4 Organización lógica, sujeta a DevOps

```text
<raíz del repositorio>/
  frontend/src/
    app/                 # composición y rutas; hoy / redirige a /inventario
    modules/inventory/   # domain/application/infrastructure/presentation
    shared/              # UI, estilos, utilidades y motion existentes
  backend/src/
    modules/             # access, branches, catalog, inventory, reports,
                         # suppliers, sales, staff y audit; public.ts por límite
    platform/            # configuración y HTTP existentes
  packages/contracts/    # proyecciones públicas TypeScript, sin framework
  docs/architecture/     # estado y decisiones de la base actual
  docs/planning/         # ejecución de los tres sprints
  Scripts/               # SQL académico conservado
  supabase/              # configuración existente; no arrancar/resetear sin permiso
```

Es la estructura observada, no una orden para mover carpetas. La landing y el acceso nuevos se ubicarán según la composición aprobada, sin recrear los antiguos directorios `features/data/ui`. Mantener npm workspaces y el único `package-lock.json` raíz. Las dependencias nuevas requieren aprobación; este cambio documental no las instala.

### 5.5 Contrato mínimo de API

Preservar las rutas actuales en inglés. Las que aún no existen son propuestas a cerrar en S1-03; no renombrar contratos o URLs por traducir este documento.

| Método / ruta orientativa | Resultado | Acceso |
|---|---|---|
| `GET /api/v1/health` | Ruta actual; hoy informa demo y BD desconectada. Separar estados de proceso/BD si se aprueba | Según política de infraestructura |
| `GET /api/v1/me` | Identidad, capacidades y sucursales autorizadas | Sesión válida |
| `GET /api/v1/inventory/metadata` | Ruta demo actual; evolucionar a sucursales/categorías autorizadas | Sesión y alcance en la integración real |
| `GET /api/v1/branches` | Consulta separada de sucursales, solo si el caso la necesita | Sesión y alcance |
| `GET /api/v1/catalog/products` | Consulta separada de producto, solo si el caso la necesita | Permiso de catálogo |
| `GET /api/v1/inventory` | Ruta demo actual; sustituir por consulta real paginada | Permiso de inventario y alcance |
| `GET /api/v1/inventory/:idFarmacia/:codigoProducto` | Ruta de detalle actual, conservando identidad compuesta y ausencia de stock | Mismo alcance |
| `GET /api/v1/reports/inventory` | Propuesta de agregados verificables | Mismo alcance |
| `GET /api/v1/suppliers` | Directorio, si se acepta P1 | Permiso específico |
| `GET /api/v1/sales` y `GET /api/v1/sales/:id` | Historial/detalle, si se acepta P1 | Consulta comercial y alcance |

No se exponen endpoints de escritura de negocio. Login, renovación o logout pueden efectuar operaciones de sesión en el proveedor; eso no autoriza modificar las tablas académicas.

Reglas del contrato:

- Paginación en servidor, conservando inicialmente las 8 filas por página del contrato actual; orden estable con desempate por clave. Si se propone un tamaño configurable, acotarlo y aprobar el cambio de contrato y sus consumidores antes de implementar.
- Filtros permitidos: sucursal, búsqueda, categoría y estados que el modelo respalde. Ningún nombre de columna SQL proviene directamente de la URL.
- Total y resumen se calculan sobre los filtros acordados, no solo sobre la página visible; documentar si un filtro no aplica a un indicador.
- Respuestas y errores consistentes: `400` entrada inválida; `401` identidad ausente/inválida; `403` permiso insuficiente; `404` registro inexistente o deliberadamente oculto; `503` dependencia no disponible.
- Las consultas al detalle vuelven a aplicar alcance: conocer un identificador no concede acceso.
- Documentar tipos, nulabilidad, ejemplos y códigos de error; no derivar el contrato de los mocks anteriores.

**Brecha técnica ya identificada:** `InventoryReadRepository.rows(idFarmacia)` carga filas completas y `metadata()` es síncrono; `InventoryQueries` filtra/ordena/pagina en memoria. El adaptador real no debe descargar todo el inventario. S1-03 y S2-03 deben proponer y aprobar un puerto asíncrono de consulta paginada y metadatos, enumerando controlador, parser, casos de uso, adaptador, contratos y tests afectados. No basta cambiar una URL.

El contrato compartido admite productos con `stock: null`. Preservar «sin registro de stock» en listado y detalle mediante la consulta apropiada; un producto existente sin fila de stock no se convierte automáticamente en 404. Un producto inexistente o fuera de alcance sí se oculta/rechaza según la política documentada. `total` cuenta resultados del listado; `summary.registros` cuenta solo los que tienen stock. No forzar que ambas cifras coincidan.

## 6. Entornos y estrategia Supabase

### 6.1 Matriz de entornos

| Entorno | Propósito | Datos | Conexiones / restricciones |
|---|---|---|---|
| Local aislado | Desarrollo e integración | Dataset sintético persistido o copia académica expresamente aprobada | Web, NestJS, PostgreSQL y Auth local; servicios limitados a la máquina del desarrollador. |
| CI aislado | Verificar cambios | Datos sintéticos mínimos y deterministas | Sin credenciales ni conectividad a la BD académica. |
| Supabase académico remoto | Conservación y eventual consulta | Datos existentes del proyecto | Sin cambios; lectura únicamente tras permiso y revisión del acceso. |
| Staging remoto, opcional | Validar despliegue e integración remota | Datos aprobados y no sensibles | Proyecto aislado si se autoriza y hay recursos; no duplicar entornos por rutina. |
| Producción | Servicio operativo público | No comprometido en noviembre | Requiere una decisión de despliegue, operación y protección de datos separada. |

Supabase dispone de una pila local con PostgreSQL y Auth. En Windows su arranque mediante el CLI requiere un runtime compatible con Docker. Confirmar que el equipo puede ejecutarlo antes de asumirlo como base. [Referencia: desarrollo local de Supabase](https://supabase.com/docs/guides/local-development).

### 6.2 Arranque local previsto, después de autorizarlo

1. Recibir de DevOps la estructura, herramienta de paquetes, versiones fijadas, puertos y procedimiento de arranque.
2. Identificar el export académico aprobado por su versión/hash; revisar que no contenga datos o credenciales impropios para distribuir.
3. Crear un destino local desechable y claramente nombrado. Registrar host, puerto y base; el procedimiento debe rechazar un destino remoto o desconocido.
4. Restaurar el baseline aprobado en ese destino, respetando el esquema. Usar un administrador local solo para el bootstrap; no para la conexión habitual de la aplicación.
5. Cargar el dataset de prueba separado. Debe incluir casos cero/nulo/sin lote/vencido y relaciones válidas. No convertir los mocks visuales anteriores en la fuente de verdad.
6. Crear o usar la cuenta local de aplicación con lectura mínima. Cuentas y privilegios locales son infraestructura, documentada y autorizada; no cambios al esquema académico remoto.
7. Configurar Auth local y cuentas de prueba; mantener sus identidades separadas de los datos académicos. Validar el mapeo de permisos del servidor.
8. Arrancar API y web; comprobar un recorrido de consulta y que ninguna conexión usa el proyecto remoto.
9. Repetir el arranque desde el instructivo; registrar evidencia, versiones y tiempo empleado.

Si la pila local no puede arrancar en el tiempo previsto, registrar el bloqueo y evaluar con DevOps un PostgreSQL/Auth de desarrollo aislado ya disponible. La reserva puede cubrirlo. No resolverlo conectando el navegador a la BD remota ni eliminando autenticación. Si no existe alternativa segura, se reduce el incremento y se declara incompleto el hito de integración.

### 6.3 Gestión del esquema y datos

- Mantener los SQL académicos como referencia conservada; no reescribirlos para generar el frontend.
- La copia local representa una versión identificada del modelo. Su restauración no crea permiso para aplicar cambios al proyecto remoto.
- No generar triggers propios para reemplazar los de la asignatura. Un baseline con triggers académicos ya existentes se replica solo si está expresamente aprobado, sin editarlos ni añadir otros.
- No activar `synchronize`, `schema sync`, migraciones automáticas ni seed remoto al arrancar la API.
- No ejecutar `db push`, reset, scripts de carga o generación de cambios contra Supabase remoto. El plan no incluye comandos que puedan hacerlo por accidente.
- Toda futura diferencia de modelo se registra como propuesta con motivo, objetos afectados, compatibilidad, pruebas y reversión. Su ejecución se excluye de estas tareas hasta nueva aprobación.
- Las pruebas de negocio usan datos de prueba; no clientes, recetas, salarios ni contraseñas reales.
- Los logs técnicos de la app se mantienen fuera de la tabla académica `auditoria`.

### 6.4 Conexión futura de NestJS a Supabase

La ruta propuesta es **NestJS → conexión PostgreSQL**, sin habilitar la Data API para resolver las consultas de la UI. Supabase documenta conexiones directas y mediante pooler; el modo se elige según red y tipo de backend. Para un proceso persistente, comprobar conectividad directa o pooler de sesión, TLS y límites de conexiones. No construir la URL suponiendo región o puertos: usar la configuración del proyecto autorizado. [Referencia: conexiones PostgreSQL en Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

Condiciones previas a una lectura remota:

1. Permiso para el proyecto y conjunto de datos concretos; revisión del estado real de Data API, grants, RLS y cuentas.
2. Credencial de aplicación con lectura mínima sobre las tablas estrictamente necesarias, no `postgres` ni un rol con DDL/escritura. Si no existe, proponer su creación y esperar autorización; no usar el administrador como atajo.
3. TLS configurado con validación adecuada, secretos en el servidor y sin exposición en web, logs o archivos versionados.
4. Límite de pool y timeouts; consultas paginadas, acotadas y cancelables cuando corresponda.
5. Validación de permisos de usuario y sucursal en NestJS, incluida la consulta de detalle y los agregados.
6. Evidencia de que la versión de la app no necesita ni ejecuta cambios de esquema, triggers ni datos académicos.

**Diferencia esencial:** una conexión SQL del backend no hereda automáticamente el usuario de Supabase Auth ni aplica por sí sola su alcance de sucursal. NestJS debe resolverlo y filtrar las consultas. No asumir protección RLS del usuario final al usar una credencial de servidor.

Desactivar la Data API impide responder a sus endpoints REST generados; no sustituye la protección de las demás vías de acceso. Si en otra fase se propone exponer tablas por la Data API, se requiere una revisión de grants/RLS específica y permiso previo. En esta release no se activa ni se alteran sus políticas. [Referencia: seguridad de la Data API](https://supabase.com/docs/guides/api/securing-your-api).

### 6.5 Configuración y secretos

DevOps definirá los nombres definitivos. El contrato de configuración debe separar al menos:

| Ámbito | Ejemplos de configuración | Regla |
|---|---|---|
| Web pública/interna | URL base de API; URL y clave publicable de Auth, si ese flujo la necesita | Todo valor incluido en el bundle es público; nunca añadir credenciales SQL ni claves secretas. |
| API | Conexión PostgreSQL, emisor/audiencia de tokens, orígenes permitidos, timeouts | Solo servidor, validados al arrancar y sin valores secretos por defecto. |
| Acceso | Mapeo administrado de identidad → perfil/sucursales | Resuelto en servidor; no editable por el cliente ni basado en metadata modificable por el usuario. |
| Entorno | Nombre local/CI/staging, origen y fecha del dataset | Visible de forma apropiada en la demo; no revelar detalles sensibles de conexión. |

Entregar un ejemplo sin secretos. Los archivos reales quedan excluidos del versionado. Ninguna prueba necesita una clave remota. La falta de configuración esencial debe impedir un arranque inseguro, no habilitar un usuario administrador ficticio.

## 7. Seguridad y acceso

### 7.1 Modelo mínimo propuesto

Los siguientes son perfiles de aplicación propuestos, **no filas que deban crearse en `rol`**:

| Actor | Landing | Catálogo/inventario | Dashboard | Proveedores P1 | Comercial P1 |
|---|---|---|---|---|---|
| Visitante | Sí | No | No | No | No |
| Consulta de sucursal | Sí | Solo sucursales asignadas | Mismo alcance | Solo si se concede expresamente | No por defecto |
| Responsable académico/administrador de consulta | Sí | Sucursales expresamente autorizadas | Mismo alcance | Con permiso | Con permiso |

Todos los perfiles son de **consulta** en esta release. «Administrador» no habilita escrituras de negocio ni cambios de BD. La matriz se valida con el propietario en S1-03; si no se aprueba un caso, su acceso permanece denegado.

### 7.2 Identidad y autorización

- Preferir Supabase Auth aislado para autenticar. En NestJS, verificar firma, emisor, audiencia y vigencia del token con una biblioteca mantenida y la configuración del proveedor; no basta decodificarlo. [Referencia: JWT de Supabase](https://supabase.com/docs/guides/auth/jwts).
- Aplicar autenticación por defecto a la API interna y marcar de forma explícita las rutas públicas. La landing no consulta endpoints internos.
- Separar identidad de permisos. Un token válido sin un perfil reconocido no obtiene acceso a inventario.
- Resolver el mapeo entre `sub` del proveedor y permisos en el servidor. Para el MVP local puede ser una configuración administrada y validada, excluida del bundle; es una solución limitada para pocos revisores, no un módulo de administración de usuarios.
- Reutilizar `usuario`/`rol` solo si el esquema ya contiene una relación fiable y aprobada con la identidad Auth. No añadir columnas o tablas puente sin aprobación.
- En cada consulta, intersectar la sucursal solicitada con las sucursales permitidas. Probar también detalle, totales y P1; el selector de la UI no es un control de seguridad.
- Usar la autorización del backend como frontera efectiva. Las opciones ocultas en la UI solo mejoran la experiencia. [Referencia: autorización de NestJS](https://docs.nestjs.com/security/authorization).

### 7.3 Controles mínimos de entrega

1. Consultas parametrizadas; allowlist de campos de orden; filtros e identificadores validados.
2. Límites de paginación y búsqueda; timeouts; errores sin SQL ni trazas privadas.
3. CORS con orígenes explícitos y cabeceras de seguridad apropiadas. El CORS no reemplaza autorización.
4. Sesiones gestionadas con el SDK/proveedor aprobado; no copiar tokens a logs ni añadir almacenamiento artesanal. Documentar expiración, renovación y logout. Si se eligen cookies, revisar atributos y protección CSRF.
5. Secretos ausentes del código, bundle, capturas y documentación; revisión de dependencias de producción.
6. Rate limiting apropiado para autenticación y consultas expuestas; no confiar solo en controles del navegador.
7. Lecturas de BD con privilegios mínimos; rutas de escritura de negocio inexistentes o rechazadas.
8. Datos de cliente, receta, salario y credenciales fuera de esta UI. En P1 comercial, devolver únicamente campos aprobados.
9. Accesos denegados y errores registrados con identificador de petición y datos mínimos; sin contenido clínico ni token completo.
10. Cierre de sesión sin reutilizar datos cacheados por otro usuario; al cambiar de sucursal se invalidan resultados incompatibles.

El MVP local no se publica en una interfaz de red abierta por comodidad. Una futura publicación debe revisar HTTPS, dominios/orígenes, cuentas de prueba, observabilidad y secretos antes de autorizar el despliegue.

## 8. Landing y reglas de experiencia de usuario

### 8.1 Landing pública primero

La primera entrega visual es una landing con:

- Cabecera con marca VitaFarma y navegación breve.
- Presentación clara del proyecto y de su alcance real.
- Sección de capacidades: catálogo, inventario por sucursal y consulta organizada.
- Sección institucional o del proyecto académico; contacto solo si se proporciona y aprueba.
- Llamada a la acción que funciona: en S1 puede llevar a una sección informativa; el acceso interno se enlaza cuando S2 lo tenga disponible.
- Pie con información aprobada y contexto académico cuando corresponda.

No inventar direcciones de farmacias, testimonios, cifras de clientes, certificaciones, disponibilidad de productos ni servicios clínicos. Si no hay datos públicos aprobados, omitir el directorio y usar contenido descriptivo veraz del proyecto. No incluir un formulario que aparente enviar mensajes sin un backend implementado.

Dirección visual vigente: verde bosque `#0B4937`, fondo `#F6F8F5`, blanco y acentos salvia; Inter para interfaz e Inter Tight para títulos, ya servidas localmente. Antes de construir la landing se presentan tres direcciones de composición distintas, referencias directas, mapa, archivos y motion plan, y se espera la elección explícita según las reglas de diseño del proyecto. Reutilizar fuentes/tokens; no instalar otras por copiar el plan histórico. Las animaciones serán breves y respetarán movimiento reducido.

### 8.2 UI interna después de G1

- Navegación con módulos implementados, sucursal visible y sesión identificable.
- Tabla legible con filtros persistidos en URL cuando aporte valor.
- Detalle con retorno al contexto anterior y al foco que lo abrió.
- Estados diferenciados: carga, sin resultados, dato ausente, error, sin permiso y sesión expirada.
- Cantidad cero, nula y registro inexistente se muestran de forma distinta.
- Teclado, foco visible, nombres accesibles y estados con texto además del color.
- Revisión en 360, 768 y 1280 px; las tablas pueden desplazarse en su propio contenedor sin romper toda la página.

### 8.3 Tratamiento del experimento previo

En S1 se inventaría qué existe, sin eliminarlo ni moverlo durante la reorganización de DevOps. Se pueden proponer componentes visuales reutilizables si pasan revisión. Los contadores, mocks, servicios de datos y reglas inventadas no se heredan como requisitos.

Si hay que aislarlo, DevOps propone la ubicación o rama y el propietario aprueba el movimiento. Solo el nuevo recorrido aceptado cuenta como entregable. No hay fallback automático a mocks cuando PostgreSQL o Auth fallen.

## 9. Epics y mapa de trabajo

| Epic | Resultado | Sprint principal | Prioridad | Tareas de ejecución |
|---|---|---|---|---|
| E01 · Base y coordinación | Una sola base de DevOps, contratos y entorno reproducible | S1 | P0 | S1-01 a S1-05, S1-08 |
| E02 · Landing e identidad | Primera experiencia pública aceptada | S1 | P0 | S1-06, S1-07 |
| E03 · Acceso seguro | Identidad real y permisos en servidor | S1/S2 | P0 | S1-03, S1-05, S2-01, S2-05 |
| E04 · Sucursales y catálogo | Datos necesarios para seleccionar y entender una existencia | S2 | P0 | S2-02, S2-04 |
| E05 · Inventario | Recorrido de consulta completo con BD | S2 | P0 | S2-03 a S2-06 |
| E06 · Indicadores | Dashboard pequeño y contrastable | S3 | P0 | S3-01 |
| E07 · Proveedores | Consulta de directorio y relación de productos | S3 | P1 | S3-02 |
| E08 · Comercial de consulta | Historial y detalle sin operaciones de venta | S3 | P1 | S3-03 |
| E09 · Calidad y entrega | Seguridad, regresión, aceptación y paquete de release | Transversal | P0 | S1-07/08, S2-05/06, S3-04 a S3-07 |

Todas las tareas tienen al desarrollador principal como responsable. El apoyo ocasional puede ejecutar verificaciones o revisar resultados, sin convertirse en dueño de una dependencia obligatoria. Cada tarea comienza como **Pendiente**; los resultados de pruebas y aprobaciones todavía no existen.

## 10. Sprint 1 — Base, contratos y landing

**Fechas:** 28/10–06/11/2026 · **Capacidad:** 48 h · **Plan:** 38 h · **Reserva:** 10 h.

**Objetivo:** cerrar la base que entrega DevOps, conocer los límites del esquema y entregar la landing antes de construir la experiencia interna. Al finalizar debe existir una integración local mínima de infraestructura, sin desarrollar aún el dashboard.

### 10.1 Condiciones de entrada

- El propietario confirma qué bloque de desarrollo local autoriza y qué archivos quedan bajo trabajo de DevOps.
- Se identifica la raíz y rama de trabajo correctas; no se trabaja sobre una ruta histórica sin comprobarla.
- Se dispone de los documentos/esquema aprobados, o se registra qué falta y se limita el trabajo a landing y contratos no dependientes de BD.

### 10.2 Tareas ejecutables

| ID / epic | P / h | Acción y artefacto | Depende de | Criterio de aceptación de la tarea |
|---|---|---|---|---|
| S1-01 · E01 | P0 · 2 h | Leer instrucciones vigentes y recibir el handoff de DevOps. Registrar estructura, rama/base, herramientas, scripts y archivos ocupados. Inventariar el experimento previo. | Autorización de trabajo local; disponibilidad del handoff | Existe un acuerdo de base y de propiedad de archivos; no hay dos reorganizaciones simultáneas. Los faltantes quedan identificados con responsable. |
| S1-02 · E01 | P0 · 4 h | Contrastar SQL/documentación con las necesidades del MVP. Producir mapa de entidades, claves, nulos, relaciones y restricciones; identificar campos permitidos por pantalla. | Documentos actuales; S1-01 para localizar fuentes | Se documenta cómo identificar stock, producto, farmacia y lote; se resuelven o marcan los seis límites de §2.2. No se ejecuta SQL remoto. |
| S1-03 · E01/E03 | P0 · 3 h | Registrar decisiones de frontend, persistencia, Auth y estructura; definir contrato API y matriz de perfil/sucursal; fijar procedencia del dataset. | S1-01, S1-02 | Las decisiones caben en un registro breve, tienen alternativa y límite; permisos no resueltos quedan denegados. El contrato no depende de mocks ni pide nuevas columnas. |
| S1-04 · E01 | P0 · 5 h | Completar sobre la base de DevOps el arranque de web/NestJS, configuración validada, health, errores y comprobaciones de tipos/lint/build. Añadir CI solo donde falte. | Base estable de DevOps; S1-03 | Web y API arrancan con configuración local; falta de secretos esenciales produce fallo explícito; las comprobaciones acordadas pasan sin conectar a remoto. |
| S1-05 · E01/E03 | P0 · 6 h | Preparar el entorno local aislado aprobado: baseline identificado, dataset persistido, conexión de lectura de API y proveedor Auth local con cuentas de prueba. Documentar reinicio y separación de destinos. | S1-02/03/04; autorización del destino local | Una lectura de integración devuelve datos desde PostgreSQL local y Auth emite una identidad de prueba verificable. Destino, origen del dataset y privilegios están documentados; ningún secreto remoto es necesario. |
| S1-06 · E02 | P0 · 10 h | Presentar tres composiciones, referencias, motion, contenido y archivos; esperar aprobación explícita y luego construir la landing móvil/escritorio. Diseño/propuesta 2 h, construcción/ajuste 7 h y revisión 1 h; la espera no consume horas de trabajo. | S1-03/04; elección y alcance aprobados | Landing con secciones de §8.1, navegación funcional, identidad VitaFarma y contenido veraz; no muestra cifras simuladas ni da acceso a información interna. |
| S1-07 · E02/E09 | P0 · 4 h | Verificar landing, teclado, foco, movimiento reducido, tres tamaños y ausencia de secretos; corregir los fallos del recorrido público. | S1-06 | Se registra evidencia visual y funcional; no hay enlaces rotos, formulario ficticio, bloqueo por teclado ni desbordamiento general en 360 px. |
| S1-08 · E01/E09 | P0 · 4 h | Completar guía de arranque y handoff, revisar G1, contrastar horas reales y reestimar S2. Hacer demostración desde el instructivo. | S1-04/05/07 | Landing aceptada y base local reproducible; se registran decisiones, pendientes y resultado de G1. S2 tiene tareas listas o bloqueos explícitos. |
| **Total** | **38 h** | | | |

Las horas de configuración ya cubiertas por DevOps se descuentan al recibir su entrega. El ahorro queda como reserva; no se duplica su implementación.

### 10.3 Orden sugerido

- **28–29/10:** S1-01, S1-02 y S1-03; recuperación de contexto y contratos.
- **29–30/10:** S1-04 y revisión de la base de DevOps; hito G0.
- **30/10–02/11:** S1-05, siempre en el destino local autorizado.
- **03–04/11:** S1-06, primera UI de producto: landing.
- **05–06/11:** S1-07/08, correcciones, documentación y G1.

Es una secuencia de bloques, no una ocupación rígida de cada hora. Ajustar por clases/feriados y consumir la reserva antes de comprometer fechas nuevas.

### 10.4 Criterios de aceptación del sprint / G1

1. Dado un visitante sin sesión, al abrir la raíz se muestra la landing y no una aplicación interna con datos simulados.
2. Dado un usuario de teclado o móvil, puede recorrer enlaces, ver foco y llegar al contenido principal sin depender de animaciones.
3. Dado el instructivo y los requisitos instalados, el desarrollador puede arrancar web/API/servicios locales aprobados y demostrar una consulta de integración.
4. Dado el esquema vigente, existe un contrato de lectura que respeta claves, nulabilidad y permisos; cualquier supuesto pendiente está identificado.
5. El dashboard anterior sigue identificado como experimento; no se presenta como parte aceptada de S1.

**Salida esperada:** versión de entrega `0.1.0` — landing y base local. La numeración identifica el paquete de entrega; crear un tag o publicarlo requerirá la autorización correspondiente.

Si G1 no se cumple, se corrige el bloqueo antes de iniciar la UI interna. Se puede seguir verificando contratos y consultas backend independientes, sin declarar aceptado el sprint.

## 11. Sprint 2 — Acceso e inventario integrado

**Fechas:** 09/11–17/11/2026 · **Capacidad:** 42 h · **Plan:** 34 h · **Reserva:** 8 h.

**Objetivo:** entregar el primer recorrido interno completo con identidad verificada, alcance de sucursal y consultas a PostgreSQL, sin dashboard adicional ni escrituras de negocio.

### 11.1 Condiciones de entrada

- G1 aceptado; base DevOps estable y contrato mínimo documentado.
- Dataset y Auth local disponibles; matriz de acceso aprobada para los perfiles de prueba.
- Ninguna tarea necesita que se creen triggers, que se active la Data API o que se altere una tabla.

### 11.2 Tareas ejecutables

| ID / epic | P / h | Acción y artefacto | Depende de | Criterio de aceptación de la tarea |
|---|---|---|---|---|
| S2-01 · E03 | P0 · 6 h | Integrar login/logout/expiración con el proveedor; verificar tokens en NestJS, resolver perfil/sucursales y proteger por defecto rutas internas. | S1-03/05; G1 | Identidad válida reconocida accede a `/me`; token ausente, alterado o vencido falla; identidad válida sin permiso recibe denegación. No existe modo administrador de fallback. |
| S2-02 · E04 | P0 · 5 h | Implementar lectura de sucursales autorizadas, categorías y producto mínimo; mapear columnas a DTO y documentar contrato. | S1-02/03/05; S2-01 | Selector solo muestra sucursales permitidas; producto conserva nulos y no expone columnas privadas. Casos de integración contrastados con BD local. |
| S2-03 · E05 | P0 · 6 h | Implementar listado/detalle de inventario, filtros y paginación en servidor, identidad compuesta y consultas parametrizadas; contrastar totales con referencia. | S2-01/02 | Se obtiene una página y total correctos; detalle incluye producto/lote cuando existe; cero, nulo y sin registro son distintos; un ID ajeno no elude el alcance. |
| S2-04 · E04/E05 | P0 · 8 h | Construir rutas internas y tabla/detalle, consumiendo HTTP real; conservar filtros/contexto, tratar carga/vacío/error/expiración. Dividir en listado 3 h, detalle 3 h y estados 2 h. | G1; S2-01/02/03 | Recorrido landing → login → sucursal → búsqueda → detalle → regreso funciona contra BD. Desconectar API muestra error, nunca datos de mock. |
| S2-05 · E03/E09 | P0 · 6 h | Ejecutar pruebas de integración y navegador del recorrido; manipular sucursal, ID y token; comprobar parámetros extremos, datos ausentes y caché entre sesiones. | S2-01 a S2-04 | Casos QA-02 a QA-08 registrados; no hay lectura de otra sucursal ni datos de un usuario anterior. Correcciones y regresión de cada defecto grave completadas. |
| S2-06 · E05/E09 | P0 · 3 h | Demostrar G2, actualizar guía y contrato, revisar capacidad, decidir qué P1 sigue viable y registrar resultado. | S2-05 | Inventario aceptado con evidencia de origen de datos, permisos y exactitud; S3 tiene alcance cerrado y P1 explícitamente incluido o retirado. |
| **Total** | **34 h** | | | |

### 11.3 Orden sugerido

- **09–10/11:** acceso y primer endpoint protegido.
- **10–12/11:** sucursales/catálogo y consultas de inventario; integración de servidor.
- **12–16/11:** listado y detalle interno con sus estados.
- **16–17/11:** pruebas, correcciones y G2.

El **13/11** se hace un control de avance, no se promete una release completa: deben funcionar autenticación y al menos una consulta real protegida. Si no funcionan, retirar P1 y usar la reserva para terminar el recorrido P0.

### 11.4 Criterios de aceptación del sprint / G2

1. Dado un usuario asignado a la sucursal A, puede consultar A y no puede consultar B por listado, detalle, filtros o llamada directa.
2. Dada una búsqueda con coincidencias conocidas, filtros, orden, total y página coinciden con el dataset de referencia; el detalle corresponde a la misma clave de existencia.
3. Dadas cantidades cero y nulas, o un lote ausente, la UI las representa sin convertirlas unas en otras.
4. Dada una sesión vencida o una dependencia caída, la UI explica el estado y permite recuperarse sin mostrar datos inventados.
5. Un acceso directo a la ruta de detalle valida sesión/alcance y permite regresar al contexto previsto.
6. No hay escrituras a tablas académicas ni consultas directas de la UI a sus tablas; el experimento anterior no participa en el proveedor de datos.

**Salida esperada:** `0.2.0` — primer MVP integrado de consulta, para el **17/11**. Si solo se dispone de datos sintéticos locales, la demo lo declara. La integración remota permanece condicionada y no se marca como realizada por equivalencia.

## 12. Sprint 3 — Indicadores, consolidación y release

**Fechas:** 18/11–27/11/2026 · **Capacidad:** 48 h · **Plan:** 38 h · **Reserva:** 10 h.

**Objetivo:** completar el dashboard con datos verificables, consolidar seguridad y entregar un MVP aceptado y reproducible. Proveedores e historial comercial entran únicamente si se mantienen las condiciones de capacidad y seguridad.

### 12.1 Condiciones de entrada

- G2 aceptado y sin defectos bloqueantes abiertos.
- Se conoce el tiempo restante real. Los 11 h P1 no se usan si hay retraso en P0 o reserva agotada.
- Todo permiso remoto necesario sigue siendo una decisión separada; su ausencia no se oculta mediante mocks.

### 12.2 Tareas ejecutables

| ID / epic | P / h | Acción y artefacto | Depende de | Criterio de aceptación de la tarea |
|---|---|---|---|---|
| S3-01 · E06 | P0 · 6 h | Definir hasta 3 métricas, implementar agregados de lectura y dashboard; enlazar cada indicador con inventario. | S2-03/05/06; G2 | Cada cifra tiene fórmula, consulta de contraste, alcance y tratamiento de nulos; aplica permisos y filtros acordados; no hay duplicación por joins ni cifras estáticas. |
| S3-02 · E07 | P1 · 5 h | Añadir directorio de proveedores y relación de productos en modo consulta, con paginación y campos aprobados. | S2-02/05; S3-01 estable; sin P0 retrasado | Directorio/detalle consultan BD, respetan permisos y estados; si no se completa su DoD, se omite de la release sin afectar P0. |
| S3-03 · E08 | P1 · 6 h | Añadir historial de ventas y detalle mínimo de consulta, después de validar relación de sucursal y campos públicos internos. | S1-02; S2-01/02/05; alcance comercial aprobado | Sin escritura ni emisión de factura; acceso por sucursal demostrado; no expone cliente/receta innecesarios ni presenta sucursal derivada como histórico inmutable. Si esa relación no es segura, se difiere. |
| S3-04 · E09 | P0 · 7 h | Revisar secretos, permisos, validación, límites, dependencias y rutas expuestas; repetir pruebas negativas sobre todos los módulos incluidos. Dividir en revisión 3 h y correcciones/reprueba 4 h. | G2; S3-01 y módulos P1 que se incluyan | Se documentan pruebas de seguridad y resultados; ningún bloqueo de acceso/datos/secretos queda abierto. P1 recibe los mismos controles o se retira. |
| S3-05 · E09 | P0 · 6 h | Ejecutar regresión funcional, accesibilidad y rendimiento de consultas; corregir fallos críticos y verificar desde instalación limpia. | S3-01/04; lista final de módulos | Recorridos QA de §15 pasan, build reproducible y consultas dentro del objetivo acordado para el dataset medido. Fallos graves tienen corrección y nueva evidencia. |
| S3-06 · E09 | P0 · 5 h | Preparar paquete de release, guía de uso/arranque, contrato, notas, limitaciones, reversión y guion de demo; verificar coherencia con lo entregado. | Contratos finales; resultados S3-04/05 | Documentación permite reproducir el arranque y la demo; incluye origen de datos, módulos retirados y restricciones. No contiene secretos ni afirma pruebas que no se ejecutaron. |
| S3-07 · E09 | P0 · 3 h | Ejecutar aceptación con el propietario o revisar su checklist, corregir incidencias finales acotadas y registrar G3. | S3-05/06 | Existe acta/checklist de aceptación o estado pendiente explícito; G3 determina si se acepta, se reduce alcance con acuerdo o se pospone. No se publica automáticamente. |
| **Total** | **38 h** | | | |

### 12.3 Orden sugerido y congelación

- **18–19/11:** dashboard P0 y definiciones de métricas.
- **19–20/11:** proveedores P1 si procede; revisión del estado global el 20/11.
- **23–24/11:** historial comercial P1 si sigue siendo viable. El **24/11** se congela funcionalidad: ninguna pantalla nueva después de esa fecha.
- **24–25/11:** cierre de seguridad y retirada de módulos incompletos; candidato de release el **25/11**.
- **25–27/11:** regresión, instructivos, aceptación y correcciones. Desde el candidato solo se aceptan correcciones, documentación y ajustes indispensables para aceptación.

El alcance comprometido se fija en G2 el 17/11. La congelación del 24/11 no permite incorporar ideas nuevas entre ambas fechas; solo terminar tareas ya seleccionadas. Si los P1 se retiran, sus 11 h se dedican a estabilidad y a resolver deuda de entrega, no a un módulo alternativo.

### 12.4 Métricas permitidas del dashboard

Validar cada fórmula contra S1-02 antes de implementarla:

| Métrica propuesta | Definición | Tratamiento especial |
|---|---|---|
| Registros de existencias | Número de claves farmacia/producto de `stock` en el alcance filtrado | No es cantidad de productos únicos en toda la cadena ni suma de unidades. |
| Registros con cantidad cero | Registros del conjunto anterior cuya cantidad es exactamente 0 | Excluye cantidad nula y ausencia de fila; no se etiqueta «stock bajo». |
| Registros con lote asociado vencido | Registros cuya fecha válida del lote asociado es anterior a la fecha de referencia | No equivale a unidades vencidas por lote; sin lote/fecha no se cuenta como vencido. |

Los joins con composición, categorías u otras relaciones no deben multiplicar registros. Documentar la identidad contada y validar con un caso que produciría duplicación si el join fuera incorrecto.

Definir en el contrato qué filtros comparten inventario y dashboard. Como regla base, cada indicador usa el conjunto completo filtrado, antes de paginar. La fecha de referencia se muestra cuando afecta a la interpretación. Los campos `DATE` se comparan como fechas civiles; un lote que vence hoy no se etiqueta «vencido» bajo la regla anterior. Confirmar esa regla con el propietario.

La hora de consulta puede mostrarse como actualización técnica; no se presenta como hora de venta o de auditoría si el modelo no la conserva. Si una métrica no se puede demostrar, se elimina o se cambia a otra acordada y sustentable, sin inventar datos.

### 12.5 Criterios de aceptación del sprint / G3

1. Dashboard y listado muestran cifras consistentes con el mismo alcance, sin mocks, duplicación ni reglas no aprobadas.
2. Todas las tareas P0 cumplen aceptación y definición de terminado. P1 incompleto no aparece como función disponible.
3. No hay defectos bloqueantes o altos abiertos; los defectos menores restantes tienen impacto, responsable y decisión explícita de aceptación.
4. Los controles negativos de autenticación y sucursal pasan en listado, detalle y agregados.
5. Existe evidencia de arranque reproducible, pruebas, seguridad y aceptación funcional.
6. Se conserva el esquema académico y no se han creado triggers propios ni utilizado privilegios remotos no autorizados.
7. Se entrega un paquete utilizable sin publicar, hacer merge o tocar Supabase automáticamente.

**Salida esperada:** `1.0.0-mvp` — consulta interna y landing aceptadas, objetivo **27/11/2026**. La denominación MVP no certifica preparación para ventas reales ni cumplimiento farmacéutico/fiscal.

## 13. Plan de release y hitos de decisión

| Hito | Fecha objetivo | Evidencia / resultado | Decisión si falla |
|---|---|---|---|
| Inicio y delimitación | 28/10 | Alcance local autorizado; disponibilidad de 6 h/día y base de coordinación registradas | Avanzar solo en documentación/lectura permitida hasta resolver el alcance. |
| G0 · Base DevOps | 30/10 | Estructura y scripts únicos; decisiones y responsables claros | Trabajar landing/contratos independientes. Si el retraso supera dos días de trabajo, reestimar y retirar P1. |
| G1 · Release 0.1.0 | 06/11 | Landing aceptada, entorno local y contrato mínimo | Priorizar el faltante P0; no iniciar UI interna pendiente de G1. |
| Control de mitad de periodo | 13/11 | Auth y primera lectura protegida verificables | Retirar P1 si no se alcanza; comunicar fecha revisada de G2. |
| G2 · Release 0.2.0 | 17/11 | Inventario integrado aceptado | Usar S3 para cerrar P0; no iniciar dashboard sobre consultas incompletas. |
| Revisión final de alcance | 20/11 | Dashboard en funcionamiento y P1 viable o retirado | Congelar ampliaciones y concentrar correcciones. |
| Congelación funcional | 24/11 | Lista final de módulos; nada parcialmente expuesto | Retirar P1 incompleto y dejar limitación registrada. |
| Candidato `1.0.0-mvp-rc.1` | 25/11 | Build y pruebas de entrega; bloqueos identificados | Corregir y volver a verificar; no llamar release final a un candidato fallido. |
| G3 · Release 1.0.0-mvp | 27/11 | Checklist de aceptación, evidencias y paquete de entrega | Declarar pendiente el MVP si falta P0. El propietario decide reducir alcance formalmente o mover la fecha. |

### 13.1 Escenarios de entrega

| Escenario | Resultado aceptable | Qué se comunica |
|---|---|---|
| Base prevista | Landing + acceso + catálogo/inventario + dashboard + documentación/pruebas, con BD local aprobada | MVP local integrado; estado de Supabase remoto por separado. |
| Capacidad favorable | Lo anterior + proveedores e historial comercial aceptados | P1 incluidos y evidencia equivalente a P0. |
| Permiso remoto concedido y acceso mínimo disponible | Comprobación de lectura remota después de la regresión local | Proyecto/dataset probado, límites y fecha de prueba; sin cambios de esquema. |
| Sin permiso remoto | Release local reproducible | Integración remota pendiente; nunca se afirma que pasó. |
| Se exige remoto para aceptación académica | Ese permiso y la comprobación pasan a ser dependencia de G3 | Replanificar si no llegan; una demo local no sustituye una exigencia de evaluación. |
| Falta P0 o falla seguridad | Entrega parcial identificada y plan de corrección | No declarar «MVP terminado» ni publicar el incremento inseguro. |

### 13.2 Paquete mínimo de release

- Código correspondiente a una revisión identificable, solo cuando su incorporación al repositorio haya sido autorizada.
- Instructivo de requisitos, configuración sin secretos, arranque, parada y recuperación del entorno local.
- Contrato API y matriz de permisos realmente implementados.
- Versión/origen del esquema y dataset utilizados; limitaciones del modelo que afectan a la UI.
- Reporte breve de pruebas con fecha, entorno, versión, resultado y evidencias.
- Notas de release: funciones incluidas, P1 retirados, errores menores aceptados y trabajo pendiente.
- Guion de demo y guía de uso del recorrido central.
- Procedimiento de reversión de aplicación; sin migraciones de BD en esta release.

### 13.3 Publicación y reversión

La entrega por defecto es local. Publicar la landing o la app es una decisión explícita posterior a disponer de un candidato revisable. Si se autoriza, DevOps documenta destino, coste, configuración de red, secretos, cuentas y procedimiento; el propietario aprueba el despliegue concreto.

La reversión prevista consiste en volver al artefacto y configuración anteriores de web/API. Como no hay migraciones de esquema ni escrituras académicas, no se plantea un rollback SQL. En local, restaurar una BD de prueba requiere comprobar nuevamente que el destino es desechable. Nunca resetear el proyecto académico como mecanismo de reversión de la UI.

## 14. Backlog por módulos

Los IDs `BL-*` permiten seguir alcance; las horas se estiman en las tareas de sprint que los implementan. **No sumar ambas tablas:** el backlog no es una segunda bolsa de horas.

| ID | Módulo / historia | P | Entrega / dependencia | Criterio de aceptación resumido |
|---|---|---|---|---|
| BL-01 | Como visitante, comprender VitaFarma desde la landing | P0 | S1-06/07 | Contenido veraz, navegación funcional, móvil y teclado. |
| BL-02 | Como desarrollador, arrancar una base única | P0 | S1-01/04/05/08 | Guía reproducible y servicios aislados sin remoto. |
| BL-03 | Como usuario, iniciar y cerrar sesión | P0 | S2-01 | Identidad verificada, expiración controlada y sesión anterior limpia. |
| BL-04 | Como responsable, limitar acceso por perfil y sucursal | P0 | S1-03; S2-01/05 | Peticiones directas y detalles respetan el alcance; denegación por defecto. |
| BL-05 | Como usuario, elegir sucursal autorizada | P0 | S2-02/04 | Selector y API muestran solo el alcance permitido. |
| BL-06 | Como usuario, identificar producto/categoría | P0 | S2-02/04 | Búsqueda y ficha mínima con nombres, códigos y nulos correctos. |
| BL-07 | Como usuario, consultar existencias filtradas y paginadas | P0 | S2-03/04/05 | Total y filas coinciden con referencia; orden estable. |
| BL-08 | Como usuario, abrir existencia y lote asociado | P0 | S2-03/04/05 | Identidad compuesta correcta, permisos repetidos y contexto conservado. |
| BL-09 | Como usuario, distinguir cero, nulo y dato no disponible | P0 | S2-03/04/05 | Estados separados y nunca reemplazados por cero o mocks. |
| BL-10 | Como usuario, consultar un resumen fiable de inventario | P0 | S3-01 | Hasta tres métricas con fórmula, alcance y validación. |
| BL-11 | Como responsable, revisar proveedores y productos asociados | P1 | S3-02 | Directorio/detalle real, mínimo de campos, permisos. |
| BL-12 | Como responsable autorizado, consultar ventas existentes | P1 | S3-03; relación de sucursal validada | Historial/detalle sin escritura, datos personales reducidos y límites históricos explícitos. |
| BL-13 | Como revisor, reproducir pruebas y demo | P0 | E09 | Evidencias y arranque verificables sin credenciales compartidas. |
| BL-14 | Administrar sucursales y catálogo | P2 | Diseño de escrituras y permisos nuevo | Validación, auditoría, integridad y reglas acordadas; estimación posterior. |
| BL-15 | Registrar venta y actualizar stock atómicamente | P2 | Reglas académicas, triggers y transacciones aprobados | Sin descuento doble; concurrencia, fallo parcial y permisos probados antes de habilitar. |
| BL-16 | Facturas, descuentos y recetas como operación | P2 | Validar requisitos, relaciones y restricciones | No emitir documentos con implicaciones fiscales o clínicas sin reglas confirmadas. |
| BL-17 | Gestionar personal, cargos, turnos, asignaciones y salarios | P2 | Revisión del modelo y datos sensibles | Acceso restringido y reglas de negocio definidas; sin exponer nómina en consultas generales. |
| BL-18 | Administrar cuentas/roles y auditoría de negocio | P2 | Relación Auth–modelo aprobada | Sin escalamiento de privilegios; política de acceso y auditoría verificadas. |
| BL-19 | Compras, recepciones, movimientos y transferencias | P2 | El modelo histórico no confirma soporte | Primero análisis de brecha y propuesta académica; no simular funciones sobre tablas inadecuadas. |
| BL-20 | Stock mínimo, trazabilidad multilot y alertas de reposición | P2 | Regla/modelo no confirmados | Requisitos y datos suficientes aprobados antes de diseñar contadores. |
| BL-21 | Despliegue público y operación continua | P2 | Permiso, hosting, seguridad y responsable operativo | HTTPS, secretos, monitorización, respaldo y reversión comprobados. |

Los módulos comerciales y de personal no se eliminan de la visión del producto; se mantienen ordenados para una release posterior. La fecha de noviembre se protege evitando tratarlos como trabajo implícito.

## 15. Pruebas, seguridad y evidencia

### 15.1 Estrategia proporcionada al alcance

- **Reglas críticas:** pruebas focalizadas de autorización por sucursal, filtros, nulabilidad y cálculo de métricas. Evitar tests que solo comprueben que existe un componente.
- **Integración PostgreSQL:** probar joins, claves compuestas, paginación y totales contra la BD de prueba. Mocks de repositorio no bastan para demostrar esa integración.
- **API:** validar contrato, errores, ausencia de campos privados y rechazo de entradas fuera del contrato.
- **Navegador:** automatizar el recorrido central de login/inventario y las regresiones de riesgo. Complementar con revisión visual y de teclado.
- **Revisión de seguridad:** pruebas negativas de acceso, secretos, validación, dependencias y ausencia de escrituras. No probar contra remoto sin permiso.
- **Aceptación:** ejecutar el guion sobre la misma revisión candidata y dejar evidencia de lo realmente observado.

DevOps y el desarrollador reutilizarán las herramientas de pruebas existentes. Si faltan, pueden acordar pruebas de NestJS/API y una herramienta de navegador como Playwright. No abrir una migración de framework de tests dentro del plan.

### 15.2 Casos mínimos de verificación

| Caso | Prueba | Resultado esperado | Primer hito |
|---|---|---|---|
| QA-01 | Landing en 360/768/1280 px, teclado, foco y movimiento reducido | Contenido accesible, enlaces funcionales y sin desbordamiento global | G1 |
| QA-02 | Acceso sin token, token alterado y token vencido | Rechazo del backend y recuperación comprensible en la UI | G2 |
| QA-03 | Token válido sin perfil/sucursal asignada | Denegación; no recibe un perfil amplio por defecto | G2 |
| QA-04 | Usuario A solicita sucursal B por URL, listado y detalle | No obtiene registros ni totales de B; política 403/404 documentada | G2 |
| QA-05 | Buscar, filtrar, ordenar y paginar un conjunto conocido | Filas y total correctos, orden estable y estado conservado | G2 |
| QA-06 | Producto con stock cero, nulo, sin lote, sin fila de stock y producto inexistente | Estados distintos; producto sin stock conserva `stock: null`, inexistente se rechaza/oculta según contrato | G2 |
| QA-07 | Abrir detalle directo y regresar; sesión expira durante consulta | Permisos comprobados, navegación coherente y ningún dato residual de otra sesión | G2 |
| QA-08 | API/BD no disponible; entrada de búsqueda inválida/extrema | Error explícito, límites aplicados y ausencia de fallback a mocks | G2 |
| QA-09 | Comparar indicadores con consulta de referencia | Coincidencia por alcance, sin duplicación de joins ni dependencia de página | G3 |
| QA-10 | Lote vencido ayer, hoy, mañana y fecha ausente | Regla de fecha civil aplicada sin corrimiento de zona horaria | G3 |
| QA-11 | Revisar bundle, logs, configuración y repositorio del candidato | Sin secretos, tokens, credenciales SQL o datos personales indebidos | G1 y G3 |
| QA-12 | Intentar escritura desde rutas y credencial habitual de app | API sin operación de negocio; privilegios efectivos de BD limitados a lectura necesaria | G2 y G3 |
| QA-13 | Repetir instalación/arranque con el instructivo | Entorno reproducible; sin conexión o reset remoto involuntario | G1 y G3 |
| QA-14 | Proveedores/historial, si se incluyen | Datos correctos y permisos equivalentes; sin campos sensibles extra ni atribución histórica engañosa | G3, P1 |
| QA-15 | Revisar diferencias de archivos académicos/configuración de acceso | Sin cambios no aprobados; evidencia coherente con las autorizaciones concedidas | Todos los gates |

La prueba QA-12 se realiza sobre el entorno local aprobado. Verificar privilegios efectivos incluye membresías/herencias; no basta que la cadena de conexión se llame «readonly». Una comprobación remota equivalente requiere autorización específica y no incluye escrituras de prueba contra datos académicos.

### 15.3 Dataset mínimo de pruebas

- Dos sucursales con perfiles de prueba de distinto alcance y uno sin permisos.
- Productos de categorías distintas y relaciones suficientes para búsqueda y detalle.
- Filas de stock con cantidad positiva, cero y nula, si la nulabilidad del esquema lo permite.
- Existencias sin lote y con lote vigente/vencido; casos de límite de fecha.
- Producto sin especialización de medicamento cuando el modelo lo permita.
- Más registros que una página para verificar orden, total y navegación.
- Relación que permitiría detectar doble conteo en un join.
- Si hay P1, proveedor con/sin relación y ventas con detalle y alcance de sucursal conocido.

No forzar un caso inválido si el esquema lo prohíbe; entonces probar la restricción y corregir la matriz. Documentar el identificador del dataset y cómo regenerarlo en local. Los datos de prueba se insertan en ese entorno autorizado, no se incluyen como proveedor alternativo del build final.

### 15.4 Rendimiento y criterios medibles

En S1-02 se registra el volumen real o del dataset aprobado. Como objetivo inicial, medir que el listado paginado y los indicadores respondan en **menos de 1 segundo de p95** en el entorno local de referencia, con hasta 5 consultas concurrentes y un conjunto de al menos 50 mediciones por operación después del calentamiento. Registrar máquina, filas, filtros y herramienta; es una meta del entorno de prueba, no un SLA de producción.

Si el volumen disponible no es representativo, declarar el límite de la medición. Revisar primero consultas, columnas y joins. No añadir índices, vistas materializadas o cachés remotas para cumplir la cifra sin propuesta y permiso. Un problema que exija cambiar el modelo se documenta y puede bloquear la función afectada.

Para accesibilidad, comprobar semántica, foco, teclado, contraste y movimiento reducido con revisión manual y herramientas disponibles. No afirmar certificación de accesibilidad a partir de un escaneo automático.

### 15.5 Hitos de calidad

| Hito | Qué se revisa | Evidencia mínima |
|---|---|---|
| G0 | Base, estructura y configuración segura | Handoff de DevOps y acuerdo de destinos |
| G1 | Landing, separación público/interno y entorno local | Capturas, checklist de teclado, resultados de arranque/build |
| G2 | Identidad, autorización, integridad de lecturas y manejo de errores | Resultados API/BD/navegador y pruebas negativas |
| G3 | Regresión completa, métricas, seguridad y entrega | Reporte del candidato, limitaciones y acta/checklist de aceptación |

Formato de evidencia: **caso → versión del código → entorno/dataset → fecha → resultado → referencia de captura/log → defecto si falla**. Usar «No ejecutado» o «Bloqueado» cuando corresponda. No copiar un resultado anterior como prueba del candidato actual si cambió el comportamiento.

## 16. Definición de listo y de terminado

### 16.1 Definición de listo para iniciar una tarea

- Objetivo, prioridad, responsable, tamaño y criterio de aceptación claros.
- Dependencias disponibles o trabajo independiente delimitado.
- Fuente de verdad identificada: esquema, contrato, contenido o regla validada.
- Archivos y directorios coordinados con DevOps; no hay un cambio concurrente incompatible.
- Dataset y permisos de prueba conocidos cuando la tarea los requiere.
- Acciones necesarias dentro de la autorización vigente. Los cambios externos no autorizados se separan como dependencia.

### 16.2 Definición de terminado de una tarea

1. Cumple sus criterios funcionales contra el contrato y el dataset identificados.
2. Tipos, lint y build aplicables pasan; no se añaden errores pendientes para «arreglar luego».
3. Las pruebas pertinentes verifican la regla y sus fallos relevantes; integración real cuando interviene la BD.
4. La UI, si existe, incluye carga/vacío/error/permisos y funciona con teclado y en los tamaños acordados.
5. El backend valida entradas y permisos; no expone secretos o campos ajenos a la necesidad de la pantalla.
6. No introduce cambios académicos, triggers, RLS, grants o operaciones remotas no aprobadas.
7. Contrato, instructivo y handoff se actualizan si cambió el uso o una decisión.
8. La evidencia corresponde a la revisión evaluada y no hay defectos bloqueantes/altos de esa tarea.
9. El resultado fue revisado por el desarrollador; por otra persona cuando esté disponible. La falta de ayudante no omite los criterios.

No contar un commit, una pantalla bonita o un conjunto de mocks como prueba suficiente de terminado. Una tarea bloqueada o a medio probar sigue abierta, aunque su código exista.

### 16.3 Definición de terminado de release

- G1, G2 y G3 aceptados; todos los P0 cerrados.
- Lista de P1 incluidos/retirados explícita y menú acorde.
- Pruebas y controles de seguridad del candidato completados; defectos menores aceptados registrados.
- Instalación, origen de datos, contratos, uso, limitaciones y reversión documentados.
- Permisos externos respetados; estado remoto declarado con precisión.
- Aceptación del propietario registrada. Si está pendiente, el estado es «candidato listo para revisión», no «release aceptada».

## 17. Riesgos y respuestas

| Riesgo | Prob. / impacto | Señal de activación | Respuesta y responsable |
|---|---|---|---|
| R1 · DevOps cambia estructura mientras se programa | Alta / alto | Rutas o scripts inestables, conflictos de archivos | Desarrollador acuerda base, responsables y ventanas; DevOps entrega handoff. Tras 2 días de retraso, reestimar y retirar P1. |
| R2 · Se intenta abarcar las 27 tablas | Alta / alto | Aparecen CRUD, ventas o personal como «pequeños extras» | Propietario y desarrollador mantienen P0; registrar ideas como P2 y su coste. No ampliar noviembre sin intercambio de alcance. |
| R3 · Supuestos del esquema incorrectos | Media / alto | No hay clave/relación fiable o el modelo no sostiene la métrica | Resolver en S1-02; ajustar consulta/alcance y documentar. No parchear la BD. |
| R4 · Auth y modelo académico no se relacionan | Media / alto | No existe vínculo confiable entre `sub` y `usuario` | Usar mapeo administrado de servidor aprobado para pocos revisores; acceso desconocido denegado. Panel completo se difiere. |
| R5 · No llega permiso o credencial remota mínima | Alta / medio-alto | Solo hay credencial de administrador o no hay autorización | Continuar en local aislado. Si remoto es requisito académico, elevar el bloqueo y replanificar G3. |
| R6 · Fuga de secretos o exposición de datos | Media / crítico | Clave en bundle/log, endpoint sin permiso o cuenta excesiva | Bloquear release, retirar exposición y corregir; si hubo una credencial comprometida, solicitar/coordinar su rotación con el propietario. Repetir pruebas. |
| R7 · Docker/Auth/entorno local no funciona | Media / alto | S1-05 consume más de 6 h sin consulta y sesión verificables | Usar reserva y apoyo DevOps para diagnóstico; evaluar alternativa aislada aprobada. No saltarse Auth ni apuntar a remoto por defecto. |
| R8 · Reutilización automática del dashboard con mocks | Alta / alto | Números fijos o fallback aparecen en el recorrido final | Auditar proveedor de datos y experimento; aprobar reutilización componente por componente y probar error de conexión. |
| R9 · Ventas dependen de triggers académicos pendientes | Alta / alto | Se pide registrar una venta o descontar stock en noviembre | Mantener escritura en P2. No duplicar lógica temporalmente en API y luego en triggers. |
| R10 · Sobrecarga del desarrollador | Alta / alto | Horas reales > plan o compromisos quitan días | Recalcular capacidad semanal; usar 28 h de reserva y retirar 11 h P1. Sin fines de semana ni ayudante obligatorios. |
| R11 · Ayudante no disponible | Media / bajo | No puede revisar una entrega | El desarrollador ejecuta el checklist previsto. No cambia el camino crítico. |
| R12 · Consultas lentas sobre carga masiva | Media / medio-alto | Listado/agregados incumplen objetivo medido | Acotar columnas, paginación y joins; medir. Cualquier índice/cambio de BD va a propuesta separada. |
| R13 · Cambios académicos durante noviembre | Media / alto | Clase introduce versiones de esquema o triggers | Registrar versión nueva, evaluar compatibilidad y permiso para replicarla localmente. No actualizar remoto ni scripts sin autorización. |
| R14 · UI promete servicios inexistentes | Media / medio | Landing anuncia farmacia operativa, envío o asesoría sin respaldo | Revisar contenido y contexto académico; omitir datos no aprobados. |
| R15 · No hay tiempo del propietario para aceptar | Media / medio | G1/G2/G3 llegan sin revisión | Preparar demo y checklist breves con anticipación; mantener «pendiente de aceptación», sin asumir aprobación por silencio. |

### 17.1 Reglas de ajuste

- Si una tarea supera su estimación en más del 50 %, o consume más de media jornada extra, registrar causa y reestimar el resto del sprint.
- Si la reserva restante es menor que el trabajo incierto pendiente, retirar P1 antes de añadir horas al desarrollador.
- Si se pierde un día, descontar 6 h. Tres días no disponibles consumen 18 h; no contarlos como recuperados por el ayudante.
- Orden de recorte: historial comercial → proveedores → retoques visuales opcionales. La landing básica, autorización, integridad de inventario, pruebas críticas y documentación de arranque siguen siendo P0.
- Cambiar una fecha o quitar un P0 requiere acuerdo del propietario y actualización del plan. No redefinir el éxito a última hora sin dejar registro.

## 18. Coordinación con DevOps y continuidad entre sesiones

### 18.1 Handoff que debe entregar DevOps

1. Raíz real, rama/revisión de base y estructura acordada.
2. Gestor de paquetes, versiones, lockfile y requisitos del equipo.
3. Scripts reales de arranque, tipos, lint, build y pruebas; indicar cuáles aún no existen.
4. Variables de configuración sin secretos y separación local/CI/remoto.
5. Servicios/puertos, persistencia local y procedimiento de parada/recuperación.
6. Configuración existente de CI y límites del despliegue, si ya hay decisiones.
7. Archivos todavía en reorganización, responsables y riesgos conocidos.
8. Estado del experimento anterior y propuesta para conservarlo o aislarlo sin sobrescribir trabajo.

Hasta recibirlo se puede avanzar en contenido de landing, contratos y revisión documental. No iniciar otra reorganización desde UI/backend en paralelo.

### 18.2 Normas de trabajo compartido

- Un responsable por archivo de infraestructura durante cada bloque. Los cambios se coordinan antes de editar, no después del conflicto.
- Para trabajo simultáneo autorizado, usar ramas/checkouts aislados según la política del repositorio. No asumir que chats distintos aíslan archivos.
- Las revisiones de QA pueden ser de solo lectura. Cada defecto debe indicar reproducción, resultado esperado/real e impacto.
- Mantener cambios pequeños y revisables; no mezclar una limpieza global con una función.
- El rol de DevOps no añade una persona de capacidad diaria al cálculo: es una dependencia de entrega de base. Si también aporta implementación posterior, recalcular únicamente cuando exista disponibilidad concreta.

### 18.3 Registro al cerrar cada bloque

Actualizar, dentro del alcance autorizado, un handoff breve en la ubicación que ya utilice el proyecto:

```text
Fecha y revisión/base:
Bloque / tarea:
Resultado implementado:
Archivos o áreas afectados:
Decisiones y motivo:
Pruebas ejecutadas + resultado + evidencia:
Pruebas pendientes o bloqueadas:
Estado de BD/Supabase y autorizaciones aplicables:
Defectos / riesgos:
Próxima tarea y dependencias:
Horas consumidas y estimación restante:
```

Propuesta de documentación complementaria, solo si no existe un equivalente: decisiones de arquitectura, contrato API, guía local, matriz de permisos, reporte QA y notas de release. Integrarse con `DB-CONTEXT.md`, briefs y handoffs existentes; evitar documentos duplicados o contradictorios.

## 19. Control de cambios y seguimiento

### 19.1 Tablero mínimo

Usar el soporte que ya tenga el proyecto, incluso un Markdown. Columnas: **Pendiente → Lista → En curso → En revisión → Terminada**, y un estado **Bloqueada** con causa. Cada tarea conserva su ID del plan.

Campos mínimos: ID, epic, prioridad, sprint, estimación/restante, dependencias, responsable, criterios de aceptación, evidencia y bloqueo. Solo «Terminada» cuando se cumple la DoD. Las horas consumidas sirven para reestimar, no para declarar progreso por sí solas.

### 19.2 Revisión semanal

Registrar cinco datos:

1. P0 aceptados y P0 pendientes.
2. Horas estimadas restantes frente a capacidad realmente disponible.
3. Reserva utilizada y motivo.
4. Bloqueos de DevOps, modelo, acceso o aceptación.
5. Decisión de mantener/retirar P1 y fecha de la siguiente demostración.

El proyecto avanza por incrementos aceptados. No medirlo por número de pantallas, tablas representadas o archivos generados.

### 19.3 Solicitud de cambio de alcance

```text
Cambio solicitado:
Problema que resuelve:
Prioridad y criterio de aceptación:
Estimación y dependencias:
Impacto sobre fechas, seguridad y BD académica:
Qué tarea sale o qué fecha cambia:
Decisión del propietario y fecha:
```

No se acepta «aprovechar y hacerlo» sin identificar el coste. Un cambio de BD se revisa además con el responsable académico; no se convierte en una tarea rutinaria del frontend.

## 20. Guion de demostración y checklist de entrega

### 20.1 Guion de 10–15 minutos

1. Mostrar la versión del candidato, el entorno y el origen del dataset.
2. Recorrer landing en escritorio y móvil; demostrar navegación por teclado.
3. Iniciar sesión con un perfil de consulta y elegir una sucursal permitida.
4. Buscar producto, aplicar filtros y recorrer una página de resultados.
5. Abrir una existencia y su lote asociado; volver conservando contexto.
6. Mostrar cero, nulo y ausencia de lote como estados distintos.
7. Abrir el dashboard y contrastar una cifra con la referencia preparada.
8. Demostrar un rechazo al solicitar otra sucursal y un estado de error sin mocks.
9. Si se incluyeron P1, mostrar un caso breve de cada módulo; si no, indicarlo en las notas.
10. Cerrar sesión y presentar resultados de pruebas, limitaciones y próximos pasos P2.

No mostrar credenciales, tokens, cadenas de conexión ni datos personales reales durante la demo.

### 20.2 Checklist de release

- [ ] Landing aceptada antes de la UI interna y con contenido revisado.
- [ ] Base de DevOps integrada sin configuraciones duplicadas.
- [ ] Esquema/dataset identificados y límites funcionales contrastados.
- [ ] Login/logout/expiración y permisos por sucursal verificados.
- [ ] Catálogo e inventario consultan PostgreSQL mediante NestJS.
- [ ] Dashboard usa métricas demostrables y consistentes con inventario.
- [ ] Proveedores/comercial incluidos solo si terminaron y pasaron revisión.
- [ ] Sin fallback a mocks ni menús de módulos incompletos.
- [ ] Tipos, lint, build y pruebas pertinentes pasan en el candidato.
- [ ] Pruebas negativas, secretos, dependencias y límites de acceso revisados.
- [ ] Ningún cambio académico/remoto ejecutado fuera de su autorización.
- [ ] Instalación, uso, contrato, evidencias y reversión documentados.
- [ ] Limitaciones, P1 retirados y defectos menores aceptados registrados.
- [ ] Aceptación del propietario registrada; publicación tratada por separado.

Las casillas están sin marcar intencionalmente: esta entrega es un plan, no evidencia de implementación ni de pruebas ejecutadas sobre VitaFarma.

## 21. Continuidad entre desarrolladores

Antes de retomar un bloque, leer el índice de planificación, las reglas de ejecución, el sprint correspondiente, el handoff de DevOps y la documentación actual de BD. Revalidar estructura y modelo en modo lectura; no recrear la base NestJS/React, sus nueve módulos, capas o contratos compartidos.

El traspaso debe identificar:

1. Tarea y subtarea activas, versión/base y archivos afectados.
2. Decisiones y permisos vigentes, incluida cualquier dependencia de entorno.
3. Resultados realmente comprobados y evidencia; pruebas pendientes por separado.
4. Bloqueos, horas consumidas/restantes y siguiente paso ejecutable.
5. Estado de datos local/remoto y límites académicos que se mantienen.

La siguiente persona propone el bloque concreto que necesita autorización y, una vez aprobado, lo completa dentro del alcance acordado. Una revisión documental no concede permiso para instalar, modificar datos, hacer commit/push o desplegar. Las ediciones rutinarias ya incluidas en un bloque autorizado no requieren repetir su aprobación.

## 22. Fuentes y trazabilidad

### 22.1 Contexto del proyecto

- Solicitud actual del propietario: planificación, tres sprints, NestJS/TypeScript, landing primero, conservación del esquema/triggers y entrega sin modificar repositorio/BD.
- Confirmación durante esta planificación: **6 horas diarias de lunes a viernes**.
- Antecedentes y documentos de planificación disponibles el 28/10/2026. Los hallazgos históricos del modelo se usan como hipótesis a revalidar; no como estado remoto comprobado hoy.
- Al incorporar la versión 1.1 se inspeccionó la copia local en la raíz indicada por el propietario: reglas, README, workspaces, arquitectura, decisiones, brief, rutas, contratos, puertos y reglas de inventario. Se contaron 27 tablas en el snapshot local. No se estableció conexión a Supabase, no se verificaron sus datos ni se repitieron pruebas de aplicación.

### 22.2 Referencias técnicas oficiales consultadas el 28/10/2026

- [Módulos de NestJS](https://docs.nestjs.com/modules): encapsulación y exportación de proveedores.
- [Autenticación de NestJS](https://docs.nestjs.com/security/authentication) y [autorización de NestJS](https://docs.nestjs.com/security/authorization): separación de identidad y permisos; adaptar la implementación a la versión fijada por DevOps.
- [Desarrollo local de Supabase](https://supabase.com/docs/guides/local-development): pila local y requisitos de ejecución.
- [Conectar a PostgreSQL en Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres): conexión de backend y modos de pooler.
- [Seguridad de la Data API](https://supabase.com/docs/guides/api/securing-your-api): grants, RLS y desactivación de endpoints generados.
- [JWT de Supabase](https://supabase.com/docs/guides/auth/jwts): verificación de tokens con herramientas mantenidas.

Las fechas, prioridades, estimaciones, límites de alcance y objetivos de rendimiento son decisiones propuestas para VitaFarma, no promesas de los proveedores. Antes de implementar se fijan versiones compatibles con el repositorio; este plan no presupone que sus dependencias ya estén instaladas.

### 22.3 Incorporación documental y precedencia

Esta versión conserva el calendario de 138 h brutas y 110 h planificadas, y lo desglosa en los tableros de sprint. Las comprobaciones previas de la base se encuentran en [la entrega de arquitectura](architecture/IMPLEMENTATION.md); no se copian como resultados nuevos ni como aceptación de la integración real.

Las instrucciones actuales del propietario y las reglas vigentes del proyecto prevalecen sobre este plan. Las [decisiones de arquitectura](architecture/DECISIONS.md) y el encabezado vigente del [brief UI](UI-DESIGN-BRIEF.md) describen la base existente; este plan organiza el trabajo siguiente. Las propuestas, autorizaciones históricas y cuerpos antiguos de los documentos no conceden permisos nuevos. El registro completo de reglas de ejecución se centraliza en [planning/REGLAS-DE-EJECUCION.md](planning/REGLAS-DE-EJECUCION.md).

