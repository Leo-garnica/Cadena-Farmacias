/*==============================================================*/
/* DBMS name:      PostgreSQL 9.x                               */
/* Created on:     14/10/2026 10:48:00                          */
/*==============================================================*/


/*==============================================================*/
/* Table: Asignacion_Farmaceutico                               */
/*==============================================================*/
create table Asignacion_Farmaceutico (
   id_asignacion        INT4                 not null,
   id_empleado          INT4                 null,
   id_ciudad            INT4                 null,
   fecha_inicio         DATE                 null,
   fecha_fin            DATE                 null,
   constraint PK_ASIGNACION_FARMACEUTICO primary key (id_asignacion)
);

/*==============================================================*/
/* Index: ASIGNACION_FARMACEUTICO_PK                            */
/*==============================================================*/
create unique index ASIGNACION_FARMACEUTICO_PK on Asignacion_Farmaceutico (
id_asignacion
);

/*==============================================================*/
/* Index: REQUIERE_TITULAR_FK                                   */
/*==============================================================*/
create  index REQUIERE_TITULAR_FK on Asignacion_Farmaceutico (
id_ciudad
);

/*==============================================================*/
/* Index: EJERCE_COMO_FK                                        */
/*==============================================================*/
create  index EJERCE_COMO_FK on Asignacion_Farmaceutico (
id_empleado
);

/*==============================================================*/
/* Table: Asignacion_Turno                                      */
/*==============================================================*/
create table Asignacion_Turno (
   id_asignacion_turno  INT4                 not null,
   id_empleado          INT4                 not null,
   id_turno             INT4                 not null,
   fecha_inicio         DATE                 not null,
   fecha_fin            DATE                 null,
   constraint PK_ASIGNACION_TURNO primary key (id_asignacion_turno)
);

/*==============================================================*/
/* Index: ASIGNACION_TURNO_PK                                   */
/*==============================================================*/
create unique index ASIGNACION_TURNO_PK on Asignacion_Turno (
id_asignacion_turno
);

/*==============================================================*/
/* Index: CUMPLE_FK                                             */
/*==============================================================*/
create  index CUMPLE_FK on Asignacion_Turno (
id_empleado
);

/*==============================================================*/
/* Index: SE_PROGRAMA_EN_FK                                     */
/*==============================================================*/
create  index SE_PROGRAMA_EN_FK on Asignacion_Turno (
id_turno
);

/*==============================================================*/
/* Table: Auditoria                                             */
/*==============================================================*/
create table Auditoria (
   id_auditoria         INT4                 not null,
   id_usuario           INT4                 null,
   fecha_hora           DATE                 null,
   accion               VARCHAR(20)          null,
   entidad_afectada     VARCHAR(60)          null,
   id_registro_afectado VARCHAR(50)          null,
   detalle              VARCHAR(500)         null,
   constraint PK_AUDITORIA primary key (id_auditoria)
);

/*==============================================================*/
/* Index: AUDITORIA_PK                                          */
/*==============================================================*/
create unique index AUDITORIA_PK on Auditoria (
id_auditoria
);

/*==============================================================*/
/* Index: EJECUTA_FK                                            */
/*==============================================================*/
create  index EJECUTA_FK on Auditoria (
id_usuario
);

/*==============================================================*/
/* Table: Cargo                                                 */
/*==============================================================*/
create table Cargo (
   id_cargo             INT4                 not null,
   nombre               VARCHAR(50)          null,
   descripcion          VARCHAR(200)         null,
   sueldo_base          DECIMAL(10,2)        null,
   constraint PK_CARGO primary key (id_cargo)
);

/*==============================================================*/
/* Index: CARGO_PK                                              */
/*==============================================================*/
create unique index CARGO_PK on Cargo (
id_cargo
);

/*==============================================================*/
/* Table: Categoria                                             */
/*==============================================================*/
create table Categoria (
   id_categoria         INT4                 not null,
   nombre               VARCHAR(100)         null,
   descripcion          VARCHAR(200)         null,
   constraint PK_CATEGORIA primary key (id_categoria)
);

/*==============================================================*/
/* Index: CATEGORIA_PK                                          */
/*==============================================================*/
create unique index CATEGORIA_PK on Categoria (
id_categoria
);

/*==============================================================*/
/* Table: Ciudad                                                */
/*==============================================================*/
create table Ciudad (
   id_ciudad            INT4                 not null,
   nombre               VARCHAR(100)         null,
   constraint PK_CIUDAD primary key (id_ciudad)
);

/*==============================================================*/
/* Index: CIUDAD_PK                                             */
/*==============================================================*/
create unique index CIUDAD_PK on Ciudad (
id_ciudad
);

/*==============================================================*/
/* Table: Cliente                                               */
/*==============================================================*/
create table Cliente (
   id_cliente           INT4                 not null,
   nombres              VARCHAR(100)         null,
   apellidos            VARCHAR(100)         null,
   telefono             VARCHAR(20)          null,
   direccion            VARCHAR(200)         null,
   correo               VARCHAR(150)         null,
   constraint PK_CLIENTE primary key (id_cliente)
);

/*==============================================================*/
/* Index: CLIENTE_PK                                            */
/*==============================================================*/
create unique index CLIENTE_PK on Cliente (
id_cliente
);

/*==============================================================*/
/* Table: Composicion                                           */
/*==============================================================*/
create table Composicion (
   codigo_producto      INT4                 not null,
   id_monodroga         INT4                 not null,
   concentracion        VARCHAR(50)          null,
   constraint PK_COMPOSICION primary key (codigo_producto, id_monodroga)
);

/*==============================================================*/
/* Index: COMPOSICION_PK                                        */
/*==============================================================*/
create unique index COMPOSICION_PK on Composicion (
codigo_producto,
id_monodroga
);

/*==============================================================*/
/* Index: CONTIENE_FK                                           */
/*==============================================================*/
create  index CONTIENE_FK on Composicion (
codigo_producto
);

/*==============================================================*/
/* Index: FORMA_PARTE_FK                                        */
/*==============================================================*/
create  index FORMA_PARTE_FK on Composicion (
id_monodroga
);

/*==============================================================*/
/* Table: Descuento                                             */
/*==============================================================*/
create table Descuento (
   id_descuento         INT4                 not null,
   codigo_producto      INT4                 null,
   descripcion          VARCHAR(200)         null,
   porcentaje           DECIMAL(5,2)         null,
   fecha_inicio         DATE                 null,
   fecha_fin            DATE                 null,
   constraint PK_DESCUENTO primary key (id_descuento)
);

/*==============================================================*/
/* Index: DESCUENTO_PK                                          */
/*==============================================================*/
create unique index DESCUENTO_PK on Descuento (
id_descuento
);

/*==============================================================*/
/* Index: APLICA_FK                                             */
/*==============================================================*/
create  index APLICA_FK on Descuento (
codigo_producto
);

/*==============================================================*/
/* Table: Detalle_Venta                                         */
/*==============================================================*/
create table Detalle_Venta (
   id_detalle           INT4                 not null,
   codigo_producto      INT4                 null,
   id_venta             INT4                 null,
   cantidad             INT4                 null,
   precio_historico     DECIMAL(10,2)        null,
   constraint PK_DETALLE_VENTA primary key (id_detalle)
);

/*==============================================================*/
/* Index: DETALLE_VENTA_PK                                      */
/*==============================================================*/
create unique index DETALLE_VENTA_PK on Detalle_Venta (
id_detalle
);

/*==============================================================*/
/* Index: INCLUYE_FK                                            */
/*==============================================================*/
create  index INCLUYE_FK on Detalle_Venta (
id_venta
);

/*==============================================================*/
/* Index: ES_VENDIDO_FK                                         */
/*==============================================================*/
create  index ES_VENDIDO_FK on Detalle_Venta (
codigo_producto
);

/*==============================================================*/
/* Table: Empleado                                              */
/*==============================================================*/
create table Empleado (
   id_empleado          INT4                 not null,
   id_cargo             INT4                 null,
   id_farmacia          INT4                 null,
   nombre_completo      VARCHAR(150)         null,
   direccion            VARCHAR(200)         null,
   fecha_nacimiento     DATE                 null,
   fecha_ingreso        DATE                 null,
   telefono             VARCHAR(20)          null,
   titulo_profesional   VARCHAR(100)         null,
   constraint PK_EMPLEADO primary key (id_empleado)
);

/*==============================================================*/
/* Index: EMPLEADO_PK                                           */
/*==============================================================*/
create unique index EMPLEADO_PK on Empleado (
id_empleado
);

/*==============================================================*/
/* Index: EMPLEA_FK                                             */
/*==============================================================*/
create  index EMPLEA_FK on Empleado (
id_farmacia
);

/*==============================================================*/
/* Index: DESEMPENA_FK                                          */
/*==============================================================*/
create  index DESEMPENA_FK on Empleado (
id_cargo
);

/*==============================================================*/
/* Table: Factura                                               */
/*==============================================================*/
create table Factura (
   id_factura           INT4                 not null,
   id_venta             INT4                 not null,
   nro_factura          INT4                 null,
   nro_actualizacion    VARCHAR(50)          null,
   nit_cliente          VARCHAR(20)          null,
   razon_social         VARCHAR(100)         null,
   fecha_emision        DATE                 null,
   codigo_control       VARCHAR(50)          null,
   constraint PK_FACTURA primary key (id_factura)
);

/*==============================================================*/
/* Index: FACTURA_PK                                            */
/*==============================================================*/
create unique index FACTURA_PK on Factura (
id_factura
);

/*==============================================================*/
/* Index: GENERA_FK                                             */
/*==============================================================*/
create  index GENERA_FK on Factura (
id_venta
);

/*==============================================================*/
/* Table: Farmacia                                              */
/*==============================================================*/
create table Farmacia (
   id_farmacia          INT4                 not null,
   id_ciudad            INT4                 null,
   nombre               VARCHAR(100)         null,
   direccion            VARCHAR(200)         null,
   telefono             VARCHAR(20)          null,
   constraint PK_FARMACIA primary key (id_farmacia)
);

/*==============================================================*/
/* Index: FARMACIA_PK                                           */
/*==============================================================*/
create unique index FARMACIA_PK on Farmacia (
id_farmacia
);

/*==============================================================*/
/* Index: TIENE_FK                                              */
/*==============================================================*/
create  index TIENE_FK on Farmacia (
id_ciudad
);

/*==============================================================*/
/* Table: Laboratorio                                           */
/*==============================================================*/
create table Laboratorio (
   id_laboratorio       INT4                 not null,
   nombre               VARCHAR(100)         null,
   telefono             VARCHAR(20)          null,
   pais_origen          VARCHAR(50)          null,
   constraint PK_LABORATORIO primary key (id_laboratorio)
);

/*==============================================================*/
/* Index: LABORATORIO_PK                                        */
/*==============================================================*/
create unique index LABORATORIO_PK on Laboratorio (
id_laboratorio
);

/*==============================================================*/
/* Table: Lote                                                  */
/*==============================================================*/
create table Lote (
   id_lote              INT4                 not null,
   codigo_producto      INT4                 null,
   codigo_alfanumerico  VARCHAR(50)          null,
   fecha_fabricacion    DATE                 null,
   fecha_vencimiento    DATE                 null,
   constraint PK_LOTE primary key (id_lote)
);

/*==============================================================*/
/* Index: LOTE_PK                                               */
/*==============================================================*/
create unique index LOTE_PK on Lote (
id_lote
);

/*==============================================================*/
/* Index: POSEE_FK                                              */
/*==============================================================*/
create  index POSEE_FK on Lote (
codigo_producto
);

/*==============================================================*/
/* Table: Medicamento                                           */
/*==============================================================*/
create table Medicamento (
   codigo_producto      INT4                 not null,
   id_laboratorio       INT4                 null,
   fecha_vencimiento    DATE                 null,
   accion_terapeutica   VARCHAR(100)         null,
   constraint PK_MEDICAMENTO primary key (codigo_producto)
);

/*==============================================================*/
/* Index: MEDICAMENTO_PK                                        */
/*==============================================================*/
create unique index MEDICAMENTO_PK on Medicamento (
codigo_producto
);

/*==============================================================*/
/* Index: FABRICA_FK                                            */
/*==============================================================*/
create  index FABRICA_FK on Medicamento (
id_laboratorio
);

/*==============================================================*/
/* Table: Monodroga                                             */
/*==============================================================*/
create table Monodroga (
   id_monodroga         INT4                 not null,
   nombre_sustancia     VARCHAR(100)         null,
   descripcion          VARCHAR(200)         null,
   constraint PK_MONODROGA primary key (id_monodroga)
);

/*==============================================================*/
/* Index: MONODROGA_PK                                          */
/*==============================================================*/
create unique index MONODROGA_PK on Monodroga (
id_monodroga
);

/*==============================================================*/
/* Table: Producto                                              */
/*==============================================================*/
create table Producto (
   codigo_producto      INT4                 not null,
   id_categoria         INT4                 null,
   nombre               VARCHAR(100)         null,
   descripcion          VARCHAR(200)         null,
   presentacion         VARCHAR(100)         null,
   precio_compra        DECIMAL(10,2)        null,
   precio_venta         DECIMAL(10,2)        null,
   constraint PK_PRODUCTO primary key (codigo_producto)
);

/*==============================================================*/
/* Index: PRODUCTO_PK                                           */
/*==============================================================*/
create unique index PRODUCTO_PK on Producto (
codigo_producto
);

/*==============================================================*/
/* Index: CLASIFICA_FK                                          */
/*==============================================================*/
create  index CLASIFICA_FK on Producto (
id_categoria
);

/*==============================================================*/
/* Table: Producto_Proveedor                                    */
/*==============================================================*/
create table Producto_Proveedor (
   codigo_producto      INT4                 not null,
   id_proveedor         INT4                 not null,
   precio_acordado      DECIMAL(10,2)        null,
   constraint PK_PRODUCTO_PROVEEDOR primary key (codigo_producto, id_proveedor)
);

/*==============================================================*/
/* Index: PRODUCTO_PROVEEDOR_PK                                 */
/*==============================================================*/
create unique index PRODUCTO_PROVEEDOR_PK on Producto_Proveedor (
codigo_producto,
id_proveedor
);

/*==============================================================*/
/* Index: ES_PROVISTO_FK                                        */
/*==============================================================*/
create  index ES_PROVISTO_FK on Producto_Proveedor (
codigo_producto
);

/*==============================================================*/
/* Index: SUMINISTRA_FK                                         */
/*==============================================================*/
create  index SUMINISTRA_FK on Producto_Proveedor (
id_proveedor
);

/*==============================================================*/
/* Table: Proveedor                                             */
/*==============================================================*/
create table Proveedor (
   id_proveedor         INT4                 not null,
   nombre               VARCHAR(100)         null,
   telefono             VARCHAR(20)          null,
   direccion            VARCHAR(200)         null,
   constraint PK_PROVEEDOR primary key (id_proveedor)
);

/*==============================================================*/
/* Index: PROVEEDOR_PK                                          */
/*==============================================================*/
create unique index PROVEEDOR_PK on Proveedor (
id_proveedor
);

/*==============================================================*/
/* Table: Receta_Medica                                         */
/*==============================================================*/
create table Receta_Medica (
   id_receta            INT4                 not null,
   id_venta             INT4                 not null,
   nombre_medico        VARCHAR(150)         null,
   matricula_medica     VARCHAR(50)          null,
   fecha_emision_receta DATE                 null,
   institucion_salud    VARCHAR(100)         null,
   constraint PK_RECETA_MEDICA primary key (id_receta)
);

/*==============================================================*/
/* Index: RECETA_MEDICA_PK                                      */
/*==============================================================*/
create unique index RECETA_MEDICA_PK on Receta_Medica (
id_receta
);

/*==============================================================*/
/* Index: REQUIERE_FK                                           */
/*==============================================================*/
create  index REQUIERE_FK on Receta_Medica (
id_venta
);

/*==============================================================*/
/* Table: Rol                                                   */
/*==============================================================*/
create table Rol (
   id_rol               INT4                 not null,
   nombre_rol           VARCHAR(50)          not null,
   descripcion          VARCHAR(200)         null,
   constraint PK_ROL primary key (id_rol)
);

/*==============================================================*/
/* Index: ROL_PK                                                */
/*==============================================================*/
create unique index ROL_PK on Rol (
id_rol
);

/*==============================================================*/
/* Table: Salario                                               */
/*==============================================================*/
create table Salario (
   id_salario           INT4                 not null,
   id_empleado          INT4                 null,
   sueldo_base          DECIMAL(10,2)        null,
   monto_antiguedad     DECIMAL(10,2)        null,
   bonos                DECIMAL(10,2)        null,
   descuentos           DECIMAL(10,2)        null,
   total_cobrar         DECIMAL(10,2)        null,
   fecha_elaboracion    DATE                 null,
   fecha_cobro          DATE                 null,
   constraint PK_SALARIO primary key (id_salario)
);

/*==============================================================*/
/* Index: SALARIO_PK                                            */
/*==============================================================*/
create unique index SALARIO_PK on Salario (
id_salario
);

/*==============================================================*/
/* Index: RECIBE_FK                                             */
/*==============================================================*/
create  index RECIBE_FK on Salario (
id_empleado
);

/*==============================================================*/
/* Table: Stock                                                 */
/*==============================================================*/
create table Stock (
   id_farmacia          INT4                 not null,
   codigo_producto      INT4                 not null,
   id_lote              INT4                 null,
   cantidad             INT4                 null,
   constraint PK_STOCK primary key (id_farmacia, codigo_producto)
);

/*==============================================================*/
/* Index: STOCK_PK                                              */
/*==============================================================*/
create unique index STOCK_PK on Stock (
id_farmacia,
codigo_producto
);

/*==============================================================*/
/* Index: ALMACENA_FK                                           */
/*==============================================================*/
create  index ALMACENA_FK on Stock (
id_farmacia
);

/*==============================================================*/
/* Index: DISPONIBLE_EN_FK                                      */
/*==============================================================*/
create  index DISPONIBLE_EN_FK on Stock (
codigo_producto
);

/*==============================================================*/
/* Index: REGISTRA_FK                                           */
/*==============================================================*/
create  index REGISTRA_FK on Stock (
id_lote
);

/*==============================================================*/
/* Table: Turno                                                 */
/*==============================================================*/
create table Turno (
   id_turno             INT4                 not null,
   nombre               VARCHAR(50)          null,
   hora_inicio          TIME                 null,
   hora_fin             TIME                 null,
   constraint PK_TURNO primary key (id_turno)
);

/*==============================================================*/
/* Index: TURNO_PK                                              */
/*==============================================================*/
create unique index TURNO_PK on Turno (
id_turno
);

/*==============================================================*/
/* Table: Usuario                                               */
/*==============================================================*/
create table Usuario (
   id_usuario           INT4                 not null,
   id_rol               INT4                 not null,
   id_empleado          INT4                 not null,
   nombre_usuario       VARCHAR(50)          not null,
   contrasena           VARCHAR(255)         not null,
   estado               VARCHAR(15)          not null,
   constraint PK_USUARIO primary key (id_usuario)
);

/*==============================================================*/
/* Index: USUARIO_PK                                            */
/*==============================================================*/
create unique index USUARIO_PK on Usuario (
id_usuario
);

/*==============================================================*/
/* Index: TIENE_ASIGNADO_FK                                     */
/*==============================================================*/
create  index TIENE_ASIGNADO_FK on Usuario (
id_rol
);

/*==============================================================*/
/* Index: SE_LE_ASIGNA_FK                                       */
/*==============================================================*/
create  index SE_LE_ASIGNA_FK on Usuario (
id_empleado
);

/*==============================================================*/
/* Table: Venta                                                 */
/*==============================================================*/
create table Venta (
   id_venta             INT4                 not null,
   id_cliente           INT4                 null,
   id_empleado          INT4                 null,
   fecha_hora           DATE                 null,
   total_cobrado        DECIMAL(10,2)        null,
   constraint PK_VENTA primary key (id_venta)
);

/*==============================================================*/
/* Index: VENTA_PK                                              */
/*==============================================================*/
create unique index VENTA_PK on Venta (
id_venta
);

/*==============================================================*/
/* Index: ATIENDE_FK                                            */
/*==============================================================*/
create  index ATIENDE_FK on Venta (
id_empleado
);

/*==============================================================*/
/* Index: REALIZA_FK                                            */
/*==============================================================*/
create  index REALIZA_FK on Venta (
id_cliente
);

alter table Asignacion_Farmaceutico
   add constraint FK_ASIGNACI_EJERCE_CO_EMPLEADO foreign key (id_empleado)
      references Empleado (id_empleado)
      on delete restrict on update restrict;

alter table Asignacion_Farmaceutico
   add constraint FK_ASIGNACI_REQUIERE__CIUDAD foreign key (id_ciudad)
      references Ciudad (id_ciudad)
      on delete restrict on update restrict;

alter table Asignacion_Turno
   add constraint FK_ASIGNACI_CUMPLE_EMPLEADO foreign key (id_empleado)
      references Empleado (id_empleado)
      on delete restrict on update restrict;

alter table Asignacion_Turno
   add constraint FK_ASIGNACI_SE_PROGRA_TURNO foreign key (id_turno)
      references Turno (id_turno)
      on delete restrict on update restrict;

alter table Auditoria
   add constraint FK_AUDITORI_EJECUTA_USUARIO foreign key (id_usuario)
      references Usuario (id_usuario)
      on delete restrict on update restrict;

alter table Composicion
   add constraint FK_COMPOSIC_CONTIENE_MEDICAME foreign key (codigo_producto)
      references Medicamento (codigo_producto)
      on delete restrict on update restrict;

alter table Composicion
   add constraint FK_COMPOSIC_FORMA_PAR_MONODROG foreign key (id_monodroga)
      references Monodroga (id_monodroga)
      on delete restrict on update restrict;

alter table Descuento
   add constraint FK_DESCUENT_APLICA_PRODUCTO foreign key (codigo_producto)
      references Producto (codigo_producto)
      on delete restrict on update restrict;

alter table Detalle_Venta
   add constraint FK_DETALLE__ES_VENDID_PRODUCTO foreign key (codigo_producto)
      references Producto (codigo_producto)
      on delete restrict on update restrict;

alter table Detalle_Venta
   add constraint FK_DETALLE__INCLUYE_VENTA foreign key (id_venta)
      references Venta (id_venta)
      on delete restrict on update restrict;

alter table Empleado
   add constraint FK_EMPLEADO_DESEMPENA_CARGO foreign key (id_cargo)
      references Cargo (id_cargo)
      on delete restrict on update restrict;

alter table Empleado
   add constraint FK_EMPLEADO_EMPLEA_FARMACIA foreign key (id_farmacia)
      references Farmacia (id_farmacia)
      on delete restrict on update restrict;

alter table Factura
   add constraint FK_FACTURA_GENERA_VENTA foreign key (id_venta)
      references Venta (id_venta)
      on delete restrict on update restrict;

alter table Farmacia
   add constraint FK_FARMACIA_TIENE_CIUDAD foreign key (id_ciudad)
      references Ciudad (id_ciudad)
      on delete restrict on update restrict;

alter table Lote
   add constraint FK_LOTE_POSEE_PRODUCTO foreign key (codigo_producto)
      references Producto (codigo_producto)
      on delete restrict on update restrict;

alter table Medicamento
   add constraint FK_MEDICAME_ES_UN_PRODUCTO foreign key (codigo_producto)
      references Producto (codigo_producto)
      on delete restrict on update restrict;

alter table Medicamento
   add constraint FK_MEDICAME_FABRICA_LABORATO foreign key (id_laboratorio)
      references Laboratorio (id_laboratorio)
      on delete restrict on update restrict;

alter table Producto
   add constraint FK_PRODUCTO_CLASIFICA_CATEGORI foreign key (id_categoria)
      references Categoria (id_categoria)
      on delete restrict on update restrict;

alter table Producto_Proveedor
   add constraint FK_PRODUCTO_ES_PROVIS_PRODUCTO foreign key (codigo_producto)
      references Producto (codigo_producto)
      on delete restrict on update restrict;

alter table Producto_Proveedor
   add constraint FK_PRODUCTO_SUMINISTR_PROVEEDO foreign key (id_proveedor)
      references Proveedor (id_proveedor)
      on delete restrict on update restrict;

alter table Receta_Medica
   add constraint FK_RECETA_M_REQUIERE_VENTA foreign key (id_venta)
      references Venta (id_venta)
      on delete restrict on update restrict;

alter table Salario
   add constraint FK_SALARIO_RECIBE_EMPLEADO foreign key (id_empleado)
      references Empleado (id_empleado)
      on delete restrict on update restrict;

alter table Stock
   add constraint FK_STOCK_ALMACENA_FARMACIA foreign key (id_farmacia)
      references Farmacia (id_farmacia)
      on delete restrict on update restrict;

alter table Stock
   add constraint FK_STOCK_DISPONIBL_PRODUCTO foreign key (codigo_producto)
      references Producto (codigo_producto)
      on delete restrict on update restrict;

alter table Stock
   add constraint FK_STOCK_REGISTRA_LOTE foreign key (id_lote)
      references Lote (id_lote)
      on delete restrict on update restrict;

alter table Usuario
   add constraint FK_USUARIO_SE_LE_ASI_EMPLEADO foreign key (id_empleado)
      references Empleado (id_empleado)
      on delete restrict on update restrict;

alter table Usuario
   add constraint FK_USUARIO_TIENE_ASI_ROL foreign key (id_rol)
      references Rol (id_rol)
      on delete restrict on update restrict;

alter table Venta
   add constraint FK_VENTA_ATIENDE_EMPLEADO foreign key (id_empleado)
      references Empleado (id_empleado)
      on delete restrict on update restrict;

alter table Venta
   add constraint FK_VENTA_REALIZA_CLIENTE foreign key (id_cliente)
      references Cliente (id_cliente)
      on delete restrict on update restrict;

