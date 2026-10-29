# Cadena-Farmacias: contexto de base de datos y plan de integración

> **Evolución local, 28/10/2026:** ya existe frontend React/Vite y una base backend
> NestJS modular con datos sintéticos. Ver [arquitectura vigente](architecture/ARCHITECTURE.md).
> Las secciones que describen ausencia de aplicación son el diagnóstico original.
> Esta nota no actualiza la verificación remota del 25/10/2026 ni cambia sus hallazgos de BD.

**Estado:** documento para revisión del equipo.  
**Fecha de verificación remota:** 25 de octubre de 2026, contexto horario America/La_Paz.  
**Referencia técnica principal:** estructura desplegada en Supabase, inspeccionada en modo lectura.  
**Autorización vigente:** crear exclusivamente este documento. Las correcciones, migraciones y el frontend descritos aquí son propuestas pendientes de aprobación.

## 1. Resumen para tomar decisiones

La base principal conserva el modelo académico: 27 tablas y 135 columnas en `public`. La comparación con el SQL original no encontró cambios de columnas, tipos, nulabilidad, claves primarias ni claves foráneas. No se propone reconstruirla ni normalizarla integralmente.

Las diferencias respecto del original son dos restricciones únicas, tres procedimientos y privilegios de acceso. La exportación local `docs/schema-supabase-actual.sql` coincide con los objetos inspeccionados en Supabase.

El problema prioritario confirmado es la seguridad: RLS está desactivada en las 27 tablas, no existen políticas y los roles `anon` y `authenticated` tienen permisos efectivos de lectura, inserción, actualización y borrado sobre todas ellas. Esta situación debe resolverse antes de habilitar acceso operativo desde un navegador.

El frontend puede adaptarse al modelo actual. Sus primeras pantallas deberían ser de consulta de inventario y catálogo. Las altas concurrentes, las ventas y el acceso a datos sensibles necesitan primero contratos de autorización, generación de identificadores y transacciones.

**Qué se propone cambiar primero, si se autoriza posteriormente:**

1. Corregir aspectos del llenado: referencias de auditoría, fechas de ejemplo, límites de configuración y separación entre generación de datos y preparación/reinicio.
2. Preparar una propuesta mínima de permisos y RLS, sin tocar tablas ni claves académicas.
3. Definir autenticación y operaciones transaccionales. Agregar objetos de BD únicamente si la solución elegida los necesita.
4. Implementar una pantalla piloto de inventario, dentro de un alcance de archivos aprobado.

La sección 12 identifica cada propuesta, su impacto y su autorización pendiente. La aprobación de este documento no autoriza esos cambios.

## 2. Alcance, fuentes y método

### 2.1. Fuentes locales

| Fuente | Papel en el análisis |
| --- | --- |
| [Reglas de ejecución](planning/REGLAS-DE-EJECUCION.md) | Conservación del modelo, aprobación de cambios y reglas de trabajo. |
| [Esquema académico original](../Scripts/farmacia_crebas.sql) | Tablas, atributos, PK, FK e índices originales. |
| [Llenado masivo](<../Scripts/llenado_masivo_farmacia_bolivia_realista (1).sql>) | Generador de ejemplos, funciones temporales y cambios de preparación. |
| [Exportación de Supabase](schema-supabase-actual.sql) | Referencia local contrastada con los catálogos remotos. |
| [Brief de UI](UI-DESIGN-BRIEF.md) | Propuestas visuales y decisiones pendientes; no acredita requisitos implementados. |
| [Referencias animadas](REFERENCIAS-ANIMADAS.md) | Inspiración de diseño, sin autorizar funcionalidades ni dependencias. |
| Configuración local de Supabase (`supabase/config.toml`, no versionada) | Configuración del entorno local, no prueba del estado del servicio remoto. |

Se revisó la documentación de diseño para el plan de pantallas. En el diagnóstico inicial no se asumió React, Next.js ni un framework existente. La evolución local posterior se documenta al inicio de este archivo.

### 2.2. Verificación remota realizada

Se utilizó acceso de solo lectura a Supabase para listar `public` y consultar catálogos: `pg_class`, `pg_attribute`, `pg_attrdef`, `pg_constraint`, `pg_index`, `pg_proc`, `pg_trigger` y `pg_policies`. También se verificaron privilegios efectivos de los roles cliente.

- Versión del servidor: PostgreSQL 17.11.
- `transaction_read_only` devolvió `on`.
- Se inspeccionaron definiciones y metadatos, no filas personales.
- La comprobación de `auth.users` se limitó a su existencia como objeto de catálogo.
- El listado de tablas proporcionó volúmenes de filas; no se usaron como prueba de integridad ni de procedencia del llenado.
- No se ejecutaron los scripts, procedimientos, migraciones ni consultas de escritura.
- No se consultaron credenciales, contraseñas, cuentas de Auth ni registros de pacientes.
- No se realizaron pruebas de acceso mediante una clave de API.

Los resultados describen los objetos inspeccionados en esa fecha. No constituyen una auditoría completa de todos los esquemas administrados por Supabase.

### 2.3. Cómo leer las afirmaciones

- **Verificado:** observado en el código local o los metadatos remotos.
- **Comportamiento del llenado:** decisión del generador de ejemplos, sin asumir que es una regla aprobada.
- **Propuesta:** operación, pantalla o cambio futuro que requiere revisión.
- **Pendiente:** información que las comprobaciones realizadas no permiten concluir.

## 3. Arquitectura comprobada

### 3.1. Repositorio y aplicación

En el diagnóstico inicial, esta copia contenía SQL, documentación y configuración local de Supabase. No se encontraron entonces archivos de aplicación frontend/backend, `package.json`, rutas, componentes, servicios ni clientes Supabase implementados.

Por tanto, no hay evidencia local de un framework UI, API de negocio, integración de autenticación o biblioteca de componentes existentes. El stack y sus dependencias se decidirán antes de implementar y deberán aprobarse dentro del alcance correspondiente.

La carpeta `supabase` contiene configuración local. Su configuración de seed apunta a `./seed.sql`, pero `supabase/seed.sql` no existe en esta copia. Esto es una discrepancia del entorno local; no demuestra un fallo del proyecto remoto.

### 3.2. Dominios presentes

| Dominio | Tablas existentes |
| --- | --- |
| Ubicación y sucursales | `ciudad`, `farmacia` |
| Personal y remuneraciones | `cargo`, `empleado`, `turno`, `asignacion_turno`, `asignacion_farmaceutico`, `salario` |
| Acceso y auditoría | `rol`, `usuario`, `auditoria` |
| Catálogo farmacéutico | `categoria`, `producto`, `medicamento`, `laboratorio`, `monodroga`, `composicion` |
| Proveedores | `proveedor`, `producto_proveedor` |
| Inventario | `lote`, `stock` |
| Comercial | `cliente`, `venta`, `detalle_venta`, `descuento`, `factura`, `receta_medica` |

### 3.3. Relaciones principales

- Una ciudad puede relacionarse con varias farmacias y asignaciones farmacéuticas.
- Un empleado puede relacionarse con una farmacia y un cargo; tiene asignaciones de turnos y registros salariales.
- Cada usuario exige empleado y rol. La unicidad desplegada permite como máximo un usuario por empleado; no obliga a que todo empleado tenga usuario.
- Un producto puede tener una fila de medicamento con la misma PK. No todos los productos deben ser medicamentos.
- La composición vincula medicamentos y monodrogas mediante una PK compuesta.
- Productos y proveedores se vinculan mediante `producto_proveedor`.
- Un producto puede tener varios lotes. `stock` admite una fila por farmacia/producto y un lote opcional asociado.
- Una venta puede relacionarse con cliente y empleado, y tener detalles, recetas y como máximo una factura.
- La sucursal de una venta se obtiene por `venta → empleado → farmacia`.
- La auditoría referencia al usuario mediante FK; la entidad y el registro afectado son referencias textuales sin FK al objeto indicado.

Todas las FK están validadas y usan `ON UPDATE RESTRICT ON DELETE RESTRICT`. La eliminación o modificación de claves referenciadas puede ser rechazada. No hay cascadas de borrado declaradas en esas relaciones.

## 4. Comparación del original, la exportación y Supabase

| Objeto | SQL académico original | Supabase verificado | Conclusión |
| --- | --- | --- | --- |
| Tablas de dominio | 27 | 27 | Coinciden los nombres normalizados a minúsculas. |
| Columnas | 135 | 135 | Coinciden nombres, tipos equivalentes y nulabilidad. |
| PK | 27 | 27 | Coinciden. |
| FK | 29 | 29, validadas | Coinciden relaciones y acciones restrictivas. |
| UNIQUE adicionales a PK | Ninguno | 2 | `uq_usuario_empleado` y `uq_factura_venta`. |
| Índices explícitos | 55 | Los mismos 55 | Sin diferencias en los índices comparados. |
| Índices físicos totales | No se ejecutó el original para contarlos | 84 válidos | 55 explícitos + 27 de PK + 2 de UNIQUE. |
| Funciones propias persistentes en public | Ninguna | Ninguna, excluidas las pertenecientes a extensiones | No hay RPC operativas del dominio verificadas. |
| Procedimientos propios en public | Ninguno | 3 | Adiciones descritas en la sección 7. |
| Triggers de aplicación | Ninguno | Ninguno | No incluye los triggers internos de integridad referencial. |
| Vistas de public | Ninguna | Ninguna | Las consultas de pantalla aún deben definirse. |
| Restricciones CHECK de las tablas | Ninguna | Ninguna | Las validaciones de dominio no están garantizadas por CHECK. |
| Defaults o identity en las columnas | Ninguno | Ninguno | Las altas necesitan suministrar identificadores. |
| Políticas RLS | Ninguna | Ninguna | Riesgo de acceso confirmado con los privilegios efectivos. |

La exportación local coincide con las tablas, columnas, restricciones e índices comparados y contiene los mismos tres procedimientos y grants amplios observados. No debe ejecutarse para actualizar la BD: aquí funciona como fuente de contraste.

`INT4`/`integer`, `DECIMAL`/`numeric` y `TIME`/`time without time zone` son representaciones equivalentes en esta comparación. El orden textual de `ON DELETE` y `ON UPDATE` tampoco es una diferencia funcional.

El encabezado del original menciona PostgreSQL 9.x, el llenado menciona PostgreSQL 16 y la configuración local declara versión mayor 17. El servidor remoto devolvió 17.11; los encabezados no son su fuente de verdad.

### 4.1. Unicidades añadidas

| Restricción | Efecto real |
| --- | --- |
| `uq_usuario_empleado` sobre `usuario.id_empleado` | Un empleado puede tener cero o un usuario. Cada usuario debe apuntar a un empleado. |
| `uq_factura_venta` sobre `factura.id_venta` | Una venta puede tener cero o una factura. Cada factura debe apuntar a una venta. |

El llenado agrega estas restricciones durante su preparación. Su presencia en Supabase es compatible con ese script, pero los metadatos no prueban qué ejecución las creó. No se propone eliminarlas ni cambiar sus claves.

## 5. Diccionario de las 27 entidades desplegadas

Los nombres se muestran en minúsculas, tal como están desplegados en el esquema `public`. **Obligatoria** indica `NOT NULL`. No hay valores predeterminados ni columnas identity en estas tablas. La obligatoriedad estructural no sustituye las validaciones funcionales.

### 5.1. `asignacion_farmaceutico`

Vincula un empleado con una ciudad durante un periodo; no asigna directamente una farmacia.

**PK:** `PRIMARY KEY (id_asignacion)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_asignacion` | `integer` | Sí | Parte de la PK |
| `id_empleado` | `integer` | No | FK → `empleado.id_empleado` |
| `id_ciudad` | `integer` | No | FK → `ciudad.id_ciudad` |
| `fecha_inicio` | `date` | No | — |
| `fecha_fin` | `date` | No | — |

### 5.2. `asignacion_turno`

Programa el turno de un empleado durante un periodo.

**PK:** `PRIMARY KEY (id_asignacion_turno)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_asignacion_turno` | `integer` | Sí | Parte de la PK |
| `id_empleado` | `integer` | Sí | FK → `empleado.id_empleado` |
| `id_turno` | `integer` | Sí | FK → `turno.id_turno` |
| `fecha_inicio` | `date` | Sí | — |
| `fecha_fin` | `date` | No | — |

### 5.3. `auditoria`

Almacena eventos asociados a un usuario y una referencia textual a la entidad afectada.

**PK:** `PRIMARY KEY (id_auditoria)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_auditoria` | `integer` | Sí | Parte de la PK |
| `id_usuario` | `integer` | No | FK → `usuario.id_usuario` |
| `fecha_hora` | `date` | No | — |
| `accion` | `character varying(20)` | No | — |
| `entidad_afectada` | `character varying(60)` | No | — |
| `id_registro_afectado` | `character varying(50)` | No | — |
| `detalle` | `character varying(500)` | No | — |

### 5.4. `cargo`

Catálogo de cargos laborales y sueldo base de referencia.

**PK:** `PRIMARY KEY (id_cargo)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_cargo` | `integer` | Sí | Parte de la PK |
| `nombre` | `character varying(50)` | No | — |
| `descripcion` | `character varying(200)` | No | — |
| `sueldo_base` | `numeric(10,2)` | No | — |

### 5.5. `categoria`

Clasifica productos.

**PK:** `PRIMARY KEY (id_categoria)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_categoria` | `integer` | Sí | Parte de la PK |
| `nombre` | `character varying(100)` | No | — |
| `descripcion` | `character varying(200)` | No | — |

### 5.6. `ciudad`

Catálogo geográfico asociado a farmacias y asignaciones farmacéuticas.

**PK:** `PRIMARY KEY (id_ciudad)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_ciudad` | `integer` | Sí | Parte de la PK |
| `nombre` | `character varying(100)` | No | — |

### 5.7. `cliente`

Datos del cliente relacionado opcionalmente con una venta.

**PK:** `PRIMARY KEY (id_cliente)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_cliente` | `integer` | Sí | Parte de la PK |
| `nombres` | `character varying(100)` | No | — |
| `apellidos` | `character varying(100)` | No | — |
| `telefono` | `character varying(20)` | No | — |
| `direccion` | `character varying(200)` | No | — |
| `correo` | `character varying(150)` | No | — |

### 5.8. `composicion`

Relación entre un medicamento y sus monodrogas, con concentración.

**PK:** `PRIMARY KEY (codigo_producto, id_monodroga)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `codigo_producto` | `integer` | Sí | Parte de la PK; FK → `medicamento.codigo_producto` |
| `id_monodroga` | `integer` | Sí | Parte de la PK; FK → `monodroga.id_monodroga` |
| `concentracion` | `character varying(50)` | No | — |

### 5.9. `descuento`

Promoción porcentual de un producto durante una vigencia.

**PK:** `PRIMARY KEY (id_descuento)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_descuento` | `integer` | Sí | Parte de la PK |
| `codigo_producto` | `integer` | No | FK → `producto.codigo_producto` |
| `descripcion` | `character varying(200)` | No | — |
| `porcentaje` | `numeric(5,2)` | No | — |
| `fecha_inicio` | `date` | No | — |
| `fecha_fin` | `date` | No | — |

### 5.10. `detalle_venta`

Productos, cantidades y precio histórico de una venta.

**PK:** `PRIMARY KEY (id_detalle)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_detalle` | `integer` | Sí | Parte de la PK |
| `codigo_producto` | `integer` | No | FK → `producto.codigo_producto` |
| `id_venta` | `integer` | No | FK → `venta.id_venta` |
| `cantidad` | `integer` | No | — |
| `precio_historico` | `numeric(10,2)` | No | — |

### 5.11. `empleado`

Personal, cargo y farmacia asociada.

**PK:** `PRIMARY KEY (id_empleado)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_empleado` | `integer` | Sí | Parte de la PK |
| `id_cargo` | `integer` | No | FK → `cargo.id_cargo` |
| `id_farmacia` | `integer` | No | FK → `farmacia.id_farmacia` |
| `nombre_completo` | `character varying(150)` | No | — |
| `direccion` | `character varying(200)` | No | — |
| `fecha_nacimiento` | `date` | No | — |
| `fecha_ingreso` | `date` | No | — |
| `telefono` | `character varying(20)` | No | — |
| `titulo_profesional` | `character varying(100)` | No | — |

### 5.12. `factura`

Comprobante asociado obligatoriamente a una venta.

**PK:** `PRIMARY KEY (id_factura)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_factura` | `integer` | Sí | Parte de la PK |
| `id_venta` | `integer` | Sí | FK → `venta.id_venta`; UNIQUE `uq_factura_venta` |
| `nro_factura` | `integer` | No | — |
| `nro_actualizacion` | `character varying(50)` | No | — |
| `nit_cliente` | `character varying(20)` | No | — |
| `razon_social` | `character varying(100)` | No | — |
| `fecha_emision` | `date` | No | — |
| `codigo_control` | `character varying(50)` | No | — |

### 5.13. `farmacia`

Sucursal asociada opcionalmente a una ciudad.

**PK:** `PRIMARY KEY (id_farmacia)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_farmacia` | `integer` | Sí | Parte de la PK |
| `id_ciudad` | `integer` | No | FK → `ciudad.id_ciudad` |
| `nombre` | `character varying(100)` | No | — |
| `direccion` | `character varying(200)` | No | — |
| `telefono` | `character varying(20)` | No | — |

### 5.14. `laboratorio`

Catálogo de laboratorios de medicamentos.

**PK:** `PRIMARY KEY (id_laboratorio)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_laboratorio` | `integer` | Sí | Parte de la PK |
| `nombre` | `character varying(100)` | No | — |
| `telefono` | `character varying(20)` | No | — |
| `pais_origen` | `character varying(50)` | No | — |

### 5.15. `lote`

Lote de producto con fechas de fabricación y vencimiento.

**PK:** `PRIMARY KEY (id_lote)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_lote` | `integer` | Sí | Parte de la PK |
| `codigo_producto` | `integer` | No | FK → `producto.codigo_producto` |
| `codigo_alfanumerico` | `character varying(50)` | No | — |
| `fecha_fabricacion` | `date` | No | — |
| `fecha_vencimiento` | `date` | No | — |

### 5.16. `medicamento`

Especialización opcional de producto, con laboratorio y acción terapéutica.

**PK:** `PRIMARY KEY (codigo_producto)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `codigo_producto` | `integer` | Sí | Parte de la PK; FK → `producto.codigo_producto` |
| `id_laboratorio` | `integer` | No | FK → `laboratorio.id_laboratorio` |
| `fecha_vencimiento` | `date` | No | — |
| `accion_terapeutica` | `character varying(100)` | No | — |

### 5.17. `monodroga`

Catálogo de sustancias que integran medicamentos.

**PK:** `PRIMARY KEY (id_monodroga)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_monodroga` | `integer` | Sí | Parte de la PK |
| `nombre_sustancia` | `character varying(100)` | No | — |
| `descripcion` | `character varying(200)` | No | — |

### 5.18. `producto`

Catálogo general con presentación, categoría y precios.

**PK:** `PRIMARY KEY (codigo_producto)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `codigo_producto` | `integer` | Sí | Parte de la PK |
| `id_categoria` | `integer` | No | FK → `categoria.id_categoria` |
| `nombre` | `character varying(100)` | No | — |
| `descripcion` | `character varying(200)` | No | — |
| `presentacion` | `character varying(100)` | No | — |
| `precio_compra` | `numeric(10,2)` | No | — |
| `precio_venta` | `numeric(10,2)` | No | — |

### 5.19. `producto_proveedor`

Relación entre producto y proveedor, con precio acordado.

**PK:** `PRIMARY KEY (codigo_producto, id_proveedor)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `codigo_producto` | `integer` | Sí | Parte de la PK; FK → `producto.codigo_producto` |
| `id_proveedor` | `integer` | Sí | Parte de la PK; FK → `proveedor.id_proveedor` |
| `precio_acordado` | `numeric(10,2)` | No | — |

### 5.20. `proveedor`

Datos del proveedor.

**PK:** `PRIMARY KEY (id_proveedor)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_proveedor` | `integer` | Sí | Parte de la PK |
| `nombre` | `character varying(100)` | No | — |
| `telefono` | `character varying(20)` | No | — |
| `direccion` | `character varying(200)` | No | — |

### 5.21. `receta_medica`

Datos de una receta vinculada a una venta; no contiene un detalle por medicamento.

**PK:** `PRIMARY KEY (id_receta)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_receta` | `integer` | Sí | Parte de la PK |
| `id_venta` | `integer` | Sí | FK → `venta.id_venta` |
| `nombre_medico` | `character varying(150)` | No | — |
| `matricula_medica` | `character varying(50)` | No | — |
| `fecha_emision_receta` | `date` | No | — |
| `institucion_salud` | `character varying(100)` | No | — |

### 5.22. `rol`

Catálogo de roles de la aplicación; no equivale a roles ni permisos PostgreSQL.

**PK:** `PRIMARY KEY (id_rol)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_rol` | `integer` | Sí | Parte de la PK |
| `nombre_rol` | `character varying(50)` | Sí | — |
| `descripcion` | `character varying(200)` | No | — |

### 5.23. `salario`

Importes y fechas de una planilla de remuneración de un empleado.

**PK:** `PRIMARY KEY (id_salario)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_salario` | `integer` | Sí | Parte de la PK |
| `id_empleado` | `integer` | No | FK → `empleado.id_empleado` |
| `sueldo_base` | `numeric(10,2)` | No | — |
| `monto_antiguedad` | `numeric(10,2)` | No | — |
| `bonos` | `numeric(10,2)` | No | — |
| `descuentos` | `numeric(10,2)` | No | — |
| `total_cobrar` | `numeric(10,2)` | No | — |
| `fecha_elaboracion` | `date` | No | — |
| `fecha_cobro` | `date` | No | — |

### 5.24. `stock`

Existencia por farmacia y producto, con un único lote asociado por fila.

**PK:** `PRIMARY KEY (id_farmacia, codigo_producto)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_farmacia` | `integer` | Sí | Parte de la PK; FK → `farmacia.id_farmacia` |
| `codigo_producto` | `integer` | Sí | Parte de la PK; FK → `producto.codigo_producto` |
| `id_lote` | `integer` | No | FK → `lote.id_lote` |
| `cantidad` | `integer` | No | — |

### 5.25. `turno`

Catálogo de horarios; puede incluir turnos que atraviesan la medianoche.

**PK:** `PRIMARY KEY (id_turno)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_turno` | `integer` | Sí | Parte de la PK |
| `nombre` | `character varying(50)` | No | — |
| `hora_inicio` | `time without time zone` | No | — |
| `hora_fin` | `time without time zone` | No | — |

### 5.26. `usuario`

Cuenta de dominio asociada a empleado y rol. No está enlazada mediante FK con Supabase Auth.

**PK:** `PRIMARY KEY (id_usuario)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_usuario` | `integer` | Sí | Parte de la PK |
| `id_rol` | `integer` | Sí | FK → `rol.id_rol` |
| `id_empleado` | `integer` | Sí | FK → `empleado.id_empleado`; UNIQUE `uq_usuario_empleado` |
| `nombre_usuario` | `character varying(50)` | Sí | — |
| `contrasena` | `character varying(255)` | Sí | No exponer ni consultar desde el frontend |
| `estado` | `character varying(15)` | Sí | — |

### 5.27. `venta`

Cabecera de venta, cliente opcional, empleado, fecha y total.

**PK:** `PRIMARY KEY (id_venta)`.

| Columna | Tipo PostgreSQL | Obligatoria | Relación o restricción |
| --- | --- | --- | --- |
| `id_venta` | `integer` | Sí | Parte de la PK |
| `id_cliente` | `integer` | No | FK → `cliente.id_cliente` |
| `id_empleado` | `integer` | No | FK → `empleado.id_empleado` |
| `fecha_hora` | `date` | No | — |
| `total_cobrado` | `numeric(10,2)` | No | — |

## 6. Reglas garantizadas y límites que debe respetar el software

| Aspecto | Qué garantiza o permite la BD actual | Adaptación propuesta sin rediseño |
| --- | --- | --- |
| Existencias | Una fila por farmacia/producto; el lote es opcional. | Mostrar existencias con ese alcance. No ofrecer inventario desglosado en varios lotes por sucursal como si ya estuviera modelado. |
| Coherencia lote/producto | Existen FK independientes, pero no una restricción que compare el producto del lote con el producto del stock. | Validar esa correspondencia dentro de la operación confiable que guarda stock. |
| Cantidades y precios | Tipos numéricos, sin CHECK de positividad. | Validar cantidades, importes y nulos en el servicio y en formularios. |
| Descuentos | Porcentaje y fechas sin límites ni exclusión de solapamientos. | Confirmar la regla de aplicación y validarla. No asumir que siempre se acumulan o que siempre gana el mayor. |
| Fecha de venta/auditoría | `fecha_hora` es DATE en ambas tablas. | Mostrar y filtrar fechas sin inventar una hora conservada. |
| Venta completa | No se exige que una cabecera tenga detalles ni que el total coincida con su suma. | Guardar y validar cabecera/detalles/total en una transacción. |
| Ajuste de stock | No hay trigger ni función que lo ejecute al registrar un detalle. | Definir explícitamente validación y actualización concurrente de stock. |
| Precio histórico | Se almacena en el detalle. | Usarlo para consultar ventas pasadas; no recalcularlas con el precio actual. |
| Vencimiento | Existe tanto en medicamento como en lote, sin sincronización automática. | Usar el vencimiento del lote para la existencia asociada y confirmar el significado del dato general del medicamento. |
| Sucursal histórica | La venta se vincula a la farmacia actual del empleado relacionado. | Informar el alcance de esa asociación; decidir el tratamiento de traslados antes de modificar empleados con ventas históricas. |
| Recetas | Se vinculan a la venta completa; no al detalle ni a un paciente separado. | Registrar y consultar con ese alcance. La obligación de receta debe confirmarse como regla funcional. |
| Turnos | Hay horas y periodos, sin comprobación de solapamiento. | Admitir turnos nocturnos; no imponer simplemente hora_fin > hora_inicio. Validar periodos y solapamientos según reglas acordadas. |
| Titularidad | La asignación farmacéutica es por ciudad; no hay control estructural del cargo/título o de solapamientos. | Mantener esa relación y validar la elegibilidad acordada en el software. |
| Auditoría | Las filas no se crean automáticamente. El identificador afectado es textual. | Generar eventos desde operaciones confiables y representar correctamente las claves compuestas. |
| Borrado | Las FK usan RESTRICT; no hay un estado de baja general en todas las tablas. | No inventar borrado lógico. Aprobar la eliminación por módulo y manejar referencias existentes. |

Estos límites no demuestran que los registros actuales estén corruptos. No se ejecutaron consultas de integridad sobre filas para afirmar eso.

## 7. Funciones, procedimientos y triggers existentes

### 7.1. Procedimientos persistentes verificados

| Procedimiento de public | Comportamiento inspeccionado | Seguridad y utilidad |
| --- | --- | --- |
| `hello()` | Emite un aviso de saludo. | SECURITY DEFINER, propietario postgres, sin search_path fijado en la rutina. Ejecutable por anon y authenticated. Su cuerpo actual no implementa una operación del dominio. |
| `mostrar_producto(IN p_id_producto integer, OUT p_nombre varchar)` | Busca el nombre de un producto por código. | SECURITY INVOKER; utiliza el nombre de tabla sin calificar. Ejecutable por anon y authenticated. La pantalla puede consultar producto sin depender de este procedimiento. |
| `proc_in(INOUT varl integer)` | Suma dos al parámetro. | SECURITY INVOKER, ejecutable por anon y authenticated. Sin función operativa identificada para el sistema. |

Se leyeron definiciones; no se ejecutaron los procedimientos.

No se propone eliminarlos por ser ejercicios académicos. Tampoco se propone reutilizar `hello` como RPC: no coincide su tipo ni su finalidad. La interfaz `supabase.rpc` documenta llamadas a funciones PostgreSQL, y los objetos encontrados son procedimientos.

No hay funciones propias persistentes, vistas ni triggers de aplicación en `public` para ventas, inventario, descuentos, salarios o auditoría. Los triggers internos que implementan integridad referencial no se cuentan como automatizaciones de negocio.

### 7.2. Funciones temporales del llenado

El script declara en `pg_temp`: `elegir`, `entre`, `celular`, `telefono_fijo`, `sin_tildes`, `nombre`, `segundo_nombre`, `apellido` y `direccion`.

Son auxiliares de generación de ejemplos; su vida corresponde a la sesión. No deben incluirse en la matriz de RPC de la aplicación ni asumirse disponibles en una conexión posterior.

### 7.3. Cálculos que solo ejecuta el generador

- Calcula el vencimiento general del medicamento como el mínimo entre sus lotes.
- Utiliza el mayor descuento vigente al generar un precio histórico.
- Calcula el total de venta sumando cantidad por precio histórico.
- Genera recetas para ventas con productos de la categoría de antibióticos usada en sus ejemplos.
- Calcula importes salariales mediante fórmulas de demostración.
- Inserta eventos de auditoría simulados.

Nada de esto queda instalado como automatización permanente. Las reglas deben confirmarse antes de implementarlas en software; especialmente las clínicas, salariales y fiscales no se acreditan como requisitos válidos por aparecer en un seed.

## 8. Matriz de módulos y operaciones de base de datos

**Todas las pantallas y permisos funcionales de esta matriz son propuestas.** No existe código de aplicación inspeccionado que las implemente. C = crear; R = consultar; U = actualizar; D = eliminar. La existencia de un permiso técnico amplio en Supabase no significa que un usuario deba recibir esa operación.

| Módulo y pantallas | Tablas consultadas o afectadas | Operaciones propuestas | Consulta o contrato necesario | Funciones/triggers disponibles |
| --- | --- | --- | --- | --- |
| Sucursales: listado y ficha | ciudad, farmacia; empleado para consulta relacionada | R; C/U administrativos; D solo si se aprueba y no hay referencias | Filtro por ciudad, sucursal y ficha relacionada | Ninguno requerido; ninguno operativo existente |
| Catálogo: búsqueda y ficha de producto | producto, categoria, medicamento, laboratorio, monodroga, composicion | R; C/U autorizados; D condicionado por referencias | Buscar/paginar; guardar producto y especialización/composición de forma coherente | No existe función transaccional de catálogo |
| Proveedores: ficha y productos ofrecidos | proveedor, producto_proveedor, producto | R/C/U; altas/bajas autorizadas de asociaciones | Asociar por ambas partes de la PK y consultar precio acordado | Ninguno |
| Inventario: existencias y lote asociado | stock, lote, producto, farmacia | R inicial; C/U controlados posteriormente | Filtrar por sucursal/producto; validar lote/producto y vencimiento; controlar concurrencia | No existe ajuste automático |
| Clientes: listado y ficha | cliente; venta para referencias | R/C/U restringidos; D pendiente | Proyección mínima de campos y búsqueda autorizada | Ninguno |
| Ventas: registro, historial y detalle | venta, detalle_venta, producto, stock, descuento, cliente, empleado; factura/receta cuando corresponda | R; C mediante operación transaccional; correcciones/anulaciones pendientes de regla aprobada | Validar actor/sucursal, productos, cantidades, precios, descuentos, total y stock; evitar doble registro | No existe función de registro de venta ni trigger de stock |
| Descuentos: listado y vigencias | descuento, producto | R/C/U; D sujeto a política acordada | Consulta por producto y fecha; confirmar solapamientos y prioridad | Ninguno |
| Facturas: ficha asociada a venta | factura, venta, detalle_venta | R/C controlados; correcciones pendientes | Respetar UNIQUE id_venta; confirmar numeración y requisitos del comprobante | Ninguno; no hay integración fiscal verificada |
| Recetas: registro y consulta por venta | receta_medica, venta, detalle_venta, producto | R/C restringidos; U/D pendientes | Validar campos y obligación según regla confirmada | No existe validación automática |
| Personal: empleados y cargos | empleado, cargo, farmacia | R/C/U administrativos; D condicionado | Validar fechas, cargo y asociación de sucursal sin reinterpretar históricos | Ninguno |
| Turnos: programación | turno, asignacion_turno, empleado | R/C/U; D de asignaciones según política | Periodos, nocturnidad, solapamientos y fecha_fin opcional | Ninguno |
| Titulares por ciudad | asignacion_farmaceutico, empleado, ciudad | R/C/U administrativos | Elegibilidad y vigencias según regla confirmada | Ninguno |
| Remuneraciones: planillas y cobro | salario, empleado, cargo | R restringida; C/U según regla aprobada | Fórmula salarial y autorización de elaboración/cobro | No existe función de nómina |
| Acceso: roles y estado de cuenta | usuario, rol, empleado; vínculo con Auth pendiente | R mínima; administración restringida de rol/estado | Nunca devolver contrasena; no permitir escalamiento de rol por el propio cliente | No hay vínculo Auth ni función de autorización del dominio |
| Auditoría: consulta de eventos | auditoria, usuario con campos mínimos autorizados | R restringida; C desde servicio confiable, sin U/D ordinarios propuestos | Filtros por fecha/acción/entidad, referencias compuestas y no inclusión de secretos | No existe trigger de auditoría |
| Reportes: ventas/inventario | Proyecciones y agregaciones de las tablas anteriores | R autorizada | Totales por periodo/sucursal/producto y vencimientos, con alcance histórico explicado | No hay vistas ni funciones de reporte |

### 8.1. Operación de venta propuesta

Antes de implementar escrituras, acordar un único contrato que valide identidad, rol y sucursal; obtenga precios y descuentos confiables; compruebe disponibilidad; guarde cabecera, detalles y documentos requeridos; actualice existencias y registre el evento aprobado.

Todo debe confirmarse o revertirse como una unidad. El total, los permisos y la disponibilidad no pueden depender únicamente del navegador.

La primera alternativa a evaluar es una transacción en backend con la estructura existente. Si la arquitectura elegida usa exclusivamente la Data API y necesita una venta atómica, una función RPC nueva puede ser el cambio mínimo. Su nombre, parámetros, privilegios y SQL deberán presentarse por separado. No está autorizada ni creada.

### 8.2. Funcionalidades sin soporte explícito

No se encontraron tablas para compras/recepciones, movimientos de inventario, transferencias, devoluciones, métodos de pago, cierre de caja, pacientes independientes ni alergias. Tampoco se verificó integración SIAT.

No se incorporarán esos módulos como requisitos existentes. Una referencia visual que los muestre no justifica agregarlos ni inventar tablas o relaciones.

## 9. Seguridad y autenticación

### 9.1. Hallazgo crítico confirmado: RLS y privilegios

En las 27 tablas de `public`:

| Control | Resultado remoto |
| --- | --- |
| RLS habilitada | No |
| RLS forzada | No |
| Políticas | Ninguna |
| Permisos efectivos anon | SELECT, INSERT, UPDATE, DELETE |
| Permisos efectivos authenticated | SELECT, INSERT, UPDATE, DELETE |

La exportación también contiene grants amplios a `service_role` y privilegios predeterminados amplios para objetos nuevos. Los privilegios efectivos SELECT/INSERT/UPDATE/DELETE de los dos roles cliente se verificaron remotamente; los privilegios predeterminados no se auditaron de nuevo en vivo.

Si `public` está expuesto mediante la API del proyecto, esos permisos no proporcionan separación de filas por usuario, rol o sucursal. No se ha comprobado la configuración remota de exposición mediante solicitudes de API. El riesgo a nivel de BD está confirmado y afecta también tablas sensibles.

**Solución mínima propuesta:** revisar los grants y diseñar RLS/políticas coherentes con la matriz funcional aprobada. Esto puede conservar las tablas, columnas y claves actuales.

No activar RLS de forma aislada: sin políticas bloquearía el acceso ordinario. Tampoco basta con esconder botones, filtrar sucursales en la UI o permitir todo a `authenticated`. El cambio deberá acompañarse de pruebas de permisos positivos y negativos en un entorno autorizado.

### 9.2. Identidad de aplicación y Supabase Auth

- Existe el objeto `auth.users`.
- No hay FK desde las tablas de `public` hacia el esquema `auth`.
- `public.usuario` no tiene columnas UUID.
- `usuario.id_empleado` y `usuario.id_rol` son obligatorios.
- `nombre_usuario` no tiene una restricción UNIQUE declarada.
- El estado de usuario es texto sin CHECK ni enum.
- La existencia de usuarios efectivos de Auth y su configuración de inicio de sesión no se inspeccionó.

El llenado define roles de ejemplo ADMINISTRADOR, REGENTE, VENDEDOR y ALMACEN; sus descripciones no implementan permisos PostgreSQL. Los estados y la correspondencia cargo/rol que genera el seed tampoco son una política de autorización aprobada.

El llenado utiliza MD5 para un valor de contraseña de demostración. No se reproduce ese valor ni el hash en este documento. No se ha comprobado cómo se autenticaría una aplicación real.

**Pendiente de decisión:** usar Supabase Auth o un mecanismo de sesión controlado por backend. Si se elige Supabase Auth y no existe otro vínculo confiable, se podría proponer una columna UUID de enlace en `usuario`, con restricciones y una estrategia de asociación de cuentas existentes. Sería una propuesta incremental independiente, sin sustituir la PK académica. No se crea ni se presupone necesaria antes de elegir arquitectura.

### 9.3. Reglas para integrar la interfaz

- No seleccionar ni enviar al navegador `usuario.contrasena`.
- No incluir claves de servicio, credenciales ni secretos en el frontend.
- Consultar solamente campos necesarios y autorizados.
- Reservar salarios, usuarios, recetas y auditoría a los permisos expresamente aprobados.
- Verificar permisos en operaciones confiables; la interfaz solo refleja esos permisos.
- Proteger cambios de roles, estados y asociación de empleado/sucursal.
- Registrar auditoría sin contraseñas, tokens ni datos personales innecesarios.

El cuerpo actual de `hello` es trivial. Su SECURITY DEFINER y permiso amplio no prueban una explotación, pero deben revisarse antes de reutilizar o ampliar la rutina.

## 10. Inconsistencias clasificadas y prioridad

P0 = resolver o acordar protección antes de exponer el sistema operativo a clientes. P1 = resolver antes de habilitar la operación afectada. P2 = mejora o mantenimiento posponible.

### 10.1. Errores y problemas del llenado masivo

| ID | Prioridad | Evidencia local | Clasificación precisa | Corrección propuesta |
| --- | --- | --- | --- | --- |
| SEED-01 | P1 antes de reutilizar la carga | Líneas 33–44: renombrado; 201–205: TRUNCATE con CASCADE; 207–216: UNIQUE | El script está declarado para pruebas, pero combina llenado, destrucción de datos y cambios estructurales. No es una carga ordinaria para la BD principal. | Convertir la ruta de llenado acordada en generación de datos sin cambios estructurales implícitos. Cualquier reinicio de pruebas debe quedar separado, explícito y sujeto a autorización; no ejecutarlo en Supabase principal. |
| SEED-02 | P1 para ejemplos fiables | Líneas 724–740: entidad aleatoria e identificador entre 1 y 30000 | Puede generar auditoría de registros inexistentes o con claves que no representan la entidad. Stock usa una PK compuesta. | Elegir referencias existentes del tipo correcto y codificar ambas partes de claves compuestas. No se afirma cuántas filas remotas están afectadas: no se consultaron. |
| SEED-03 | P2; P1 si se necesitan horas | Líneas 648–655 y 724–736 generan timestamp; columnas remotas DATE | La hora generada se pierde. Es una incompatibilidad del generador con la capacidad actual, no prueba de que haya que cambiar el esquema. | Generar fechas y documentar el alcance; proponer timestamp solo ante un requisito confirmado. |
| SEED-04 | P2 | Periodos octubre de 2025 a septiembre de 2026; corte de stock 14/10/2026 | Los ejemplos son históricos y pueden dejar vacías pantallas de vigencia actual. No es un error de integridad por sí mismo. | Parametrizar fecha de referencia y periodo, o etiquetar el conjunto como histórico. No reemplazar automáticamente los datos remotos. |
| SEED-05 | P2 | Stock se genera antes de ventas, sin descontarlo después | El conjunto no representa una conciliación de movimientos históricos. | Documentar stock como fotografía y no usar los datos para afirmar conciliación. Solo si el objetivo de prueba lo exige, hacer coherente el generador dentro del modelo disponible. |
| SEED-06 | P2 | Configuración editable y catálogos con arreglos de tamaño fijo | Aumentar cantidades puede superar arreglos de nombres o eliminar cargos esperados. No se observó este fallo en los valores predeterminados. | Validar límites o hacer que los generadores admitan las cantidades documentadas. |

El script declara que sus contactos y operaciones son ficticios, que ciertos nombres de laboratorio son referencias reales y que los comprobantes no son facturas legales SIAT. No se tratarán sus datos como registros operativos validados.

### 10.2. Diferencias entre SQL original y Supabase

| ID | Diferencia verificada | Impacto | Acción propuesta |
| --- | --- | --- | --- |
| DIFF-01 | UNIQUE usuario/empleado y factura/venta | Limita correctamente la cardinalidad máxima que solo la FK no imponía. | Documentar y respetar. No eliminar ni recrear las restricciones. |
| DIFF-02 | Tres procedimientos adicionales | No resuelven operaciones completas del sistema. | Conservar y documentar su finalidad académica/pendiente de confirmar. |
| DIFF-03 | Grants y permisos cliente amplios | Combinados con RLS desactivada, afectan la separación de acceso. | Tratar como SEC-01, no como normalización de dominio. |
| DIFF-04 | Versiones indicadas en encabezados | Pueden confundir la compatibilidad del entorno. | Usar 17.11 como versión remota observada; revisar comentarios y configuración solo con autorización. |

### 10.3. Errores críticos y condiciones previas para operaciones reales

| ID | Prioridad | Problema | Solución mínima a evaluar |
| --- | --- | --- | --- |
| SEC-01 | P0 | Ausencia de RLS/políticas y CRUD efectivo para ambos roles cliente en todas las tablas. | Grants y políticas según identidad, rol y sucursal; sin rediseñar tablas. |
| AUTH-01 | P1 antes de login y permisos personales | No hay enlace estructural verificado entre usuario de dominio y Supabase Auth, ni código de autenticación disponible. | Elegir arquitectura de sesión. Solo después evaluar un vínculo incremental si se requiere. |
| TX-01 | P1 antes de registrar ventas/ajustes | No existe operación atómica instalada para venta, total y stock. | Transacción en backend; RPC mínima únicamente si la arquitectura lo exige. |
| ID-01 | P1 antes de altas concurrentes | Los IDs enteros no tienen defaults ni identity. | Distinguir códigos de negocio de IDs internos. Elegir asignación segura; no usar MAX(id)+1 sin una estrategia transaccional de concurrencia. Si se necesitan secuencias/defaults, proponer solo los de las tablas afectadas, conservando valores y PK. |
| VAL-01 | P1 antes de escrituras del módulo | Sin CHECK ni automatismos de coherencia de importes, periodos o lote/producto. | Validación confiable en el software y transacciones. Restricciones adicionales solo si se justifican y aprueban. |

AUTH-01, TX-01 e ID-01 describen vacíos de integración comprobados, no incidentes ni corrupción de datos demostrados. Pueden resolverse en parte o completamente en software.

### 10.4. Mejoras opcionales que se pueden posponer

| Mejora | Motivo para posponer |
| --- | --- |
| Eliminar índices redundantes | No bloquea el frontend; no se propone borrar objetos ahora. |
| Convertir DATE a timestamp | La UI puede trabajar con fechas; primero debe existir el requisito de hora. |
| Rediseñar stock para múltiples lotes por sucursal | Implicaría revisar la PK y el dominio. Se conserva el modelo académico y se muestra su alcance real. |
| Agregar movimientos, compras, pagos o devoluciones | Son funcionalidades nuevas, no correcciones necesarias para consultar el esquema actual. |
| Normalizar datos de contacto o catálogos adicionales | Fuera del objetivo actual. |
| Añadir vistas/reportes materializados | Primero implementar consultas acotadas y medir necesidades. |
| Automatizar todo con triggers | Aumenta el alcance sin un contrato de negocio aprobado. No se propone por defecto. |
| Corregir toda la atribución histórica de sucursal | Requiere reglas sobre traslados y datos históricos, todavía no confirmadas. |

## 11. Plan propuesto del frontend

### 11.1. Orden de trabajo y condiciones de avance

| Etapa | Entregable propuesto | Condición previa |
| --- | --- | --- |
| 0. Revisión de contexto | Este documento, decisiones y alcance del equipo | Autorizada únicamente la creación de este MD |
| 1. Contratos de datos y seguridad | Campos por pantalla, permisos y estrategia de sesión | Aprobación específica; sin ejecutar cambios remotos |
| 2. Piloto de inventario | Listado consultable, filtro de sucursal, búsqueda y panel de producto/lote | Concepto visual, stack y archivos aprobados; acceso protegido para datos reales |
| 3. Catálogo/proveedores | Fichas y consultas; posteriormente mantenimiento autorizado | Identificadores y validaciones resueltos para las altas |
| 4. Ventas/documentos | Historial y registro transaccional | TX-01, permisos, precios/descuentos y reglas de comprobantes/recetas confirmados |
| 5. Personal/remuneraciones/auditoría | Pantallas con autorización restringida | Política de acceso y reglas específicas aprobadas |
| 6. Verificación | Pruebas funcionales, permisos y UI | Entorno autorizado y criterios de aceptación acordados |

No se propone empezar todas las pantallas a la vez. Un piloto de consulta permite validar relaciones, densidad y navegación antes de habilitar escrituras.

El frontend debe proyectar campos concretos, paginar, manejar nulabilidad y usar relaciones reales. Las consultas y permisos se encapsularán en una capa de acceso a datos con contratos claros, sin inventar un backend ya existente.

### 11.2. Tres direcciones visuales pendientes de elección

Las opciones son propuestas de concepto, sin paletas aprobadas, código, paquetes ni fuentes instalados. Todas toman como referencias [Pulse Clinic](https://dribbble.com/shots/27699617-Pulse-Clinic-Counter-to-Supplier-Pharmacy-Dashboard-Animation) para jerarquía/estados y [UI Animation for Dashboard](https://dribbble.com/shots/6524491-UI-Animation-for-Dashboard) para continuidad entre vistas. Se leyeron las páginas y descripciones; no se reprodujeron ni validaron sus animaciones.

| Opción | Jerarquía y composición | Tokens propuestos | Adaptación y riesgo |
| --- | --- | --- | --- |
| A. Control de sucursales — recomendada para el piloto | Selector de sucursal y filtros arriba; tabla central; ficha lateral que conserva contexto. Su elemento distintivo es la lectura conjunta de existencias y lote asociado. | Fondo #EFF4F7, superficie #FFFFFF, tinta #183047, acción #176B8F, alerta #A34B22. Segoe UI con fallback sans-serif; base espacial 4 px, controles de 8 px de radio. | En móvil, columnas esenciales y ficha separada. Vigilar densidad y contraste. Referencias: ambas anteriores, aplicadas a estados y pestañas, sin copiar movimientos/compras inexistentes. |
| B. Mostrador | Búsqueda y selección a la izquierda; detalle de operación a la derecha. Se priorizan producto, cantidad, precio histórico cuando corresponda y total legible. | Fondo #F2F6F1, superficie #FFFFFF, tinta #203528, acción #356B48, alerta #A34B22. Segoe UI y Georgia en títulos; base 4 px, zonas de operación claramente delimitadas. | En móvil, secuencia de selección/resumen. Adecuada para ventas después de resolver TX-01; no es el primer piloto recomendado. Referencias: ambas anteriores, para continuidad de una tarea y confirmaciones. |
| C. Ficha farmacológica | Lista de productos y ficha principal con presentación, composición, laboratorio y lotes. El distintivo es la claridad de relaciones farmacológicas disponibles. | Fondo #F2F4F8, superficie #FFFFFF, tinta #24334A, acción #425DA8, alerta #A34B22. Segoe UI y Cambria en títulos; base 4 px, secciones con radios de 6 px. | En móvil, ficha lineal y navegación de retorno explícita. Evitar convertir información de catálogo en recomendaciones clínicas. Referencias: ambas anteriores, para secciones y cambio de pestañas. |

La recomendación A se basa en que inventario está representado por relaciones concretas y puede comenzar como consulta. La selección final corresponde al equipo.

### 11.3. Motion plan y accesibilidad

Máximo tres patrones en el piloto:

1. Abrir una fila → mostrar ficha contextual → transición breve de 120–180 ms → conservar la orientación.
2. Cambiar pestaña de la ficha → transición breve de opacidad → mantener estructura y foco.
3. Cambiar filtros → indicar carga y actualizar resultados sin animar cifras → hacer visible el estado de la consulta.

Con `prefers-reduced-motion`, usar cambios inmediatos o prácticamente estáticos. No animar cada fila al cargar ni retrasar acciones para completar un efecto.

El diseño debe comprobar teclado/foco, etiquetas, contraste, mensajes de error, estados vacío/carga y tamaños de referencia 360/768/1280 px. Todavía no existen capturas, prototipos ni pruebas de UI ejecutadas. No se instalarán librerías de animación por defecto.

## 12. Registro concreto de cambios propuestos y aprobación

| Propuesta | Archivo u objeto afectado | Cambio que se quiere evaluar | Compatibilidad/riesgo | Estado |
| --- | --- | --- | --- | --- |
| DOC-01 | `docs/DB-CONTEXT.md` | Crear este contexto y plan de revisión | Solo documentación, sin secretos ni datos personales | Creación autorizada; contenido sujeto a revisión |
| SEED-01 | Script local de llenado masivo | Separar la generación de datos de renombrados, restricciones y reinicio destructivo; mantener claro el uso de pruebas | Puede cambiar la forma de preparar una base de pruebas; no altera la BD por editar el archivo | Pendiente de aprobación |
| SEED-02 | Script local de llenado masivo | Corregir referencias de auditoría y representación de claves compuestas | Cambia ejemplos generados, no el esquema | Pendiente de aprobación |
| SEED-03/04/06 | Script local de llenado masivo | Alinear DATE, parametrizar periodos/corte y validar límites | Cambia resultados de futuras cargas; no se ejecutará sobre la BD principal | Pendiente de aprobación |
| LOCAL-01 | `supabase/config.toml` o ubicación del seed, según se decida | Resolver la referencia a un seed local inexistente sin apuntarla automáticamente al llenado destructivo | Solo entorno local; no es necesario para el primer documento | Pendiente de decisión y aprobación |
| SEC-01 | Privilegios y políticas de las tablas usadas por la aplicación | Preparar migración mínima de acceso y pruebas correspondientes | Puede bloquear acceso o permitir demasiado si se diseña mal; revisar identidad y roles antes de ejecutar | Propuesta crítica; no hay migración creada ni autorizada |
| AUTH-01 | Integración de sesión; eventualmente un vínculo en usuario | Diseñar la relación confiable entre identidad y usuario/empleado/rol | Una columna UUID sería solo una alternativa si se elige Supabase Auth; requiere asociación y revisión de datos existentes | Pendiente de decisión; no se propone cambiar la PK |
| TX-01 | Servicio backend; eventualmente una nueva función RPC | Registrar venta/stock de forma atómica | Contrato y permisos deben revisarse; puede evitar cambios de tabla | Pendiente de arquitectura y aprobación |
| ID-01 | Software; eventualmente secuencias/defaults de IDs internos afectados | Resolver altas concurrentes sin reutilizar identificadores | Preservar IDs actuales y distinguir códigos de negocio; no aplicar generación automática a todas las tablas sin revisar | Pendiente de necesidad y aprobación |
| UI-01 | Archivos frontend todavía por definir | Piloto de inventario dentro de una sola ruta/área | No hay stack ni lista concreta de archivos aprobados | Pendiente de concepto, stack y alcance |

No se propone modificar `Scripts/farmacia_crebas.sql` para reemplazar el modelo académico, reejecutar la exportación, cambiar PK/FK, eliminar objetos o normalizar toda la BD.

Antes de una implementación se presentará la lista exacta de archivos del stack elegido. No se ha autorizado crear un proyecto frontend completo, nuevas migraciones o documentos adicionales.

Antes de cualquier modificación remota se presentarán problema, objetos afectados, SQL mínimo de migración, compatibilidad, riesgos y pruebas. La revisión del SQL y su ejecución tendrán el alcance expresamente autorizado; redactar una propuesta no autoriza ejecutarla.

## 13. Incertidumbres y comprobaciones pendientes

| Información pendiente | Cómo verificarla con el menor acceso necesario |
| --- | --- |
| Esquemas realmente expuestos por la API y acceso externo efectivo | Revisar configuración del proyecto y, con alcance aprobado, pruebas de autorización sin extraer datos personales. La configuración local no basta. |
| Identidad, login y correspondencia con roles de dominio | Revisar configuración y código cuando exista; inspeccionar metadatos antes de necesitar registros. No listar cuentas por defecto. |
| Permisos funcionales de cada rol y alcance entre sucursales | Validar con el equipo. Los nombres/descripciones del llenado no equivalen a una especificación aprobada. |
| Reglas de descuentos, recetas, remuneraciones y comprobantes | Confirmar requisitos existentes; no derivar obligaciones clínicas, fiscales o laborales de ejemplos. |
| Integridad de los registros desplegados | Solo si hace falta, consultas agregadas y acotadas para nulos, totales, stock/lote o referencias de auditoría. No realizadas todavía. |
| Stock como fotografía y relación con el historial de ventas | Acordar el significado de los datos de prueba; el esquema carece de movimientos. |
| Traslados de empleados y atribución histórica de sucursal | Definir la política antes de editar esas asociaciones o publicar reportes como históricos inmutables. |
| Generación de IDs | Decidir por entidad y modalidad de acceso antes de habilitar altas concurrentes. |
| Privilegios predeterminados remotos y objetos fuera de public | Ampliar la auditoría de metadatos únicamente si la integración los necesita. |
| Código de aplicación en otra carpeta o repositorio | Localizar la fuente real antes de reemplazar o crear una aplicación que ya pudiera existir fuera de esta copia. |
| Framework, dependencias, marca y dispositivos prioritarios | Aprobación de arquitectura y concepto; no hay una elección vigente en el brief. |

## 14. Evidencia de verificación y límites de entrega

### Realizado

- Lectura de reglas del proyecto, SQL original, lógica del llenado, exportación y documentación de UI.
- Inspección remota de columnas, tipos, nulabilidad, defaults/identity, PK, FK, UNIQUE, índices, rutinas, triggers de aplicación, vistas, RLS y privilegios cliente.
- Comparación programática de las definiciones locales con el snapshot remoto, normalizando tipos equivalentes y orden textual de acciones de FK.
- Resultado: sin diferencias de tablas/columnas ni de PK/FK originales; dos UNIQUE adicionales. La exportación coincide en los objetos comparados.
- Verificación de existencia del objeto auth.users y ausencia de FK public→auth y de columnas UUID en usuario, sin leer cuentas.
- Revisión del estado de Git para conservar el trabajo previo sin seguimiento; no se añadieron archivos al índice ni se creó un commit.
- Creación autorizada exclusivamente de este documento.

### No realizado

- Migraciones, DDL/DML remotos, ejecución del llenado o de los procedimientos.
- Lectura de filas personales, extracción de contraseñas o claves API.
- Auditoría completa de todos los esquemas internos de Supabase.
- Pruebas de integridad sobre los registros, pruebas de escritura, concurrencia o permisos desde clientes.
- Instalación de dependencias, creación de frontend/backend o publicación.
- Pruebas visuales, capturas o comprobación de contraste de las paletas propuestas.

### Referencias técnicas

- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): grants, habilitación de RLS y políticas.
- [Supabase JavaScript: RPC](https://supabase.com/docs/reference/javascript/rpc): llamada de funciones PostgreSQL desde el cliente.
- Las fuentes locales enlazadas en la sección 2 contienen las definiciones y la lógica analizada. Los enlaces de diseño son inspiración; no amplían los requisitos del dominio.

## 15. Decisiones que debe revisar el equipo

1. Si este documento describe correctamente el modelo y el alcance académico que se quiere conservar.
2. Cuáles correcciones del llenado se autorizan y qué finalidad tendrá la próxima carga; todavía no se autoriza ejecutarla.
3. Qué usuarios pueden consultar o modificar cada módulo y si su alcance es por sucursal o por toda la cadena.
4. Qué mecanismo de autenticación y arquitectura de acceso se utilizarán.
5. Si se aprueba preparar una propuesta separada de seguridad y contratos transaccionales.
6. Si el primer piloto será Inventario y qué dirección visual, stack y archivos se autorizarán.

**Hasta recibir esas decisiones, el único cambio autorizado y realizado en esta fase es la creación de este MD.**

