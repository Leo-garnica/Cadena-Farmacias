


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE PROCEDURE "public"."hello"()
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RAISE NOTICE 'Hello world';
END;
$$;


ALTER PROCEDURE "public"."hello"() OWNER TO "postgres";


CREATE PROCEDURE "public"."mostrar_producto"(IN "p_id_producto" integer, OUT "p_nombre" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    SELECT nombre
    INTO p_nombre
    FROM Producto
    WHERE codigo_producto = p_id_producto;
END;
$$;


ALTER PROCEDURE "public"."mostrar_producto"(IN "p_id_producto" integer, OUT "p_nombre" character varying) OWNER TO "postgres";


CREATE PROCEDURE "public"."proc_in"(INOUT "varl" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
		   varl := varl + 2;
END;
$$;


ALTER PROCEDURE "public"."proc_in"(INOUT "varl" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."asignacion_farmaceutico" (
    "id_asignacion" integer NOT NULL,
    "id_empleado" integer,
    "id_ciudad" integer,
    "fecha_inicio" "date",
    "fecha_fin" "date"
);


ALTER TABLE "public"."asignacion_farmaceutico" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asignacion_turno" (
    "id_asignacion_turno" integer NOT NULL,
    "id_empleado" integer NOT NULL,
    "id_turno" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date"
);


ALTER TABLE "public"."asignacion_turno" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auditoria" (
    "id_auditoria" integer NOT NULL,
    "id_usuario" integer,
    "fecha_hora" "date",
    "accion" character varying(20),
    "entidad_afectada" character varying(60),
    "id_registro_afectado" character varying(50),
    "detalle" character varying(500)
);


ALTER TABLE "public"."auditoria" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cargo" (
    "id_cargo" integer NOT NULL,
    "nombre" character varying(50),
    "descripcion" character varying(200),
    "sueldo_base" numeric(10,2)
);


ALTER TABLE "public"."cargo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categoria" (
    "id_categoria" integer NOT NULL,
    "nombre" character varying(100),
    "descripcion" character varying(200)
);


ALTER TABLE "public"."categoria" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ciudad" (
    "id_ciudad" integer NOT NULL,
    "nombre" character varying(100)
);


ALTER TABLE "public"."ciudad" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cliente" (
    "id_cliente" integer NOT NULL,
    "nombres" character varying(100),
    "apellidos" character varying(100),
    "telefono" character varying(20),
    "direccion" character varying(200),
    "correo" character varying(150)
);


ALTER TABLE "public"."cliente" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."composicion" (
    "codigo_producto" integer NOT NULL,
    "id_monodroga" integer NOT NULL,
    "concentracion" character varying(50)
);


ALTER TABLE "public"."composicion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."descuento" (
    "id_descuento" integer NOT NULL,
    "codigo_producto" integer,
    "descripcion" character varying(200),
    "porcentaje" numeric(5,2),
    "fecha_inicio" "date",
    "fecha_fin" "date"
);


ALTER TABLE "public"."descuento" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."detalle_venta" (
    "id_detalle" integer NOT NULL,
    "codigo_producto" integer,
    "id_venta" integer,
    "cantidad" integer,
    "precio_historico" numeric(10,2)
);


ALTER TABLE "public"."detalle_venta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."empleado" (
    "id_empleado" integer NOT NULL,
    "id_cargo" integer,
    "id_farmacia" integer,
    "nombre_completo" character varying(150),
    "direccion" character varying(200),
    "fecha_nacimiento" "date",
    "fecha_ingreso" "date",
    "telefono" character varying(20),
    "titulo_profesional" character varying(100)
);


ALTER TABLE "public"."empleado" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."factura" (
    "id_factura" integer NOT NULL,
    "id_venta" integer NOT NULL,
    "nro_factura" integer,
    "nro_actualizacion" character varying(50),
    "nit_cliente" character varying(20),
    "razon_social" character varying(100),
    "fecha_emision" "date",
    "codigo_control" character varying(50)
);


ALTER TABLE "public"."factura" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."farmacia" (
    "id_farmacia" integer NOT NULL,
    "id_ciudad" integer,
    "nombre" character varying(100),
    "direccion" character varying(200),
    "telefono" character varying(20)
);


ALTER TABLE "public"."farmacia" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."laboratorio" (
    "id_laboratorio" integer NOT NULL,
    "nombre" character varying(100),
    "telefono" character varying(20),
    "pais_origen" character varying(50)
);


ALTER TABLE "public"."laboratorio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lote" (
    "id_lote" integer NOT NULL,
    "codigo_producto" integer,
    "codigo_alfanumerico" character varying(50),
    "fecha_fabricacion" "date",
    "fecha_vencimiento" "date"
);


ALTER TABLE "public"."lote" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medicamento" (
    "codigo_producto" integer NOT NULL,
    "id_laboratorio" integer,
    "fecha_vencimiento" "date",
    "accion_terapeutica" character varying(100)
);


ALTER TABLE "public"."medicamento" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monodroga" (
    "id_monodroga" integer NOT NULL,
    "nombre_sustancia" character varying(100),
    "descripcion" character varying(200)
);


ALTER TABLE "public"."monodroga" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."producto" (
    "codigo_producto" integer NOT NULL,
    "id_categoria" integer,
    "nombre" character varying(100),
    "descripcion" character varying(200),
    "presentacion" character varying(100),
    "precio_compra" numeric(10,2),
    "precio_venta" numeric(10,2)
);


ALTER TABLE "public"."producto" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."producto_proveedor" (
    "codigo_producto" integer NOT NULL,
    "id_proveedor" integer NOT NULL,
    "precio_acordado" numeric(10,2)
);


ALTER TABLE "public"."producto_proveedor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proveedor" (
    "id_proveedor" integer NOT NULL,
    "nombre" character varying(100),
    "telefono" character varying(20),
    "direccion" character varying(200)
);


ALTER TABLE "public"."proveedor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receta_medica" (
    "id_receta" integer NOT NULL,
    "id_venta" integer NOT NULL,
    "nombre_medico" character varying(150),
    "matricula_medica" character varying(50),
    "fecha_emision_receta" "date",
    "institucion_salud" character varying(100)
);


ALTER TABLE "public"."receta_medica" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rol" (
    "id_rol" integer NOT NULL,
    "nombre_rol" character varying(50) NOT NULL,
    "descripcion" character varying(200)
);


ALTER TABLE "public"."rol" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."salario" (
    "id_salario" integer NOT NULL,
    "id_empleado" integer,
    "sueldo_base" numeric(10,2),
    "monto_antiguedad" numeric(10,2),
    "bonos" numeric(10,2),
    "descuentos" numeric(10,2),
    "total_cobrar" numeric(10,2),
    "fecha_elaboracion" "date",
    "fecha_cobro" "date"
);


ALTER TABLE "public"."salario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock" (
    "id_farmacia" integer NOT NULL,
    "codigo_producto" integer NOT NULL,
    "id_lote" integer,
    "cantidad" integer
);


ALTER TABLE "public"."stock" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."turno" (
    "id_turno" integer NOT NULL,
    "nombre" character varying(50),
    "hora_inicio" time without time zone,
    "hora_fin" time without time zone
);


ALTER TABLE "public"."turno" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuario" (
    "id_usuario" integer NOT NULL,
    "id_rol" integer NOT NULL,
    "id_empleado" integer NOT NULL,
    "nombre_usuario" character varying(50) NOT NULL,
    "contrasena" character varying(255) NOT NULL,
    "estado" character varying(15) NOT NULL
);


ALTER TABLE "public"."usuario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venta" (
    "id_venta" integer NOT NULL,
    "id_cliente" integer,
    "id_empleado" integer,
    "fecha_hora" "date",
    "total_cobrado" numeric(10,2)
);


ALTER TABLE "public"."venta" OWNER TO "postgres";


ALTER TABLE ONLY "public"."asignacion_farmaceutico"
    ADD CONSTRAINT "pk_asignacion_farmaceutico" PRIMARY KEY ("id_asignacion");



ALTER TABLE ONLY "public"."asignacion_turno"
    ADD CONSTRAINT "pk_asignacion_turno" PRIMARY KEY ("id_asignacion_turno");



ALTER TABLE ONLY "public"."auditoria"
    ADD CONSTRAINT "pk_auditoria" PRIMARY KEY ("id_auditoria");



ALTER TABLE ONLY "public"."cargo"
    ADD CONSTRAINT "pk_cargo" PRIMARY KEY ("id_cargo");



ALTER TABLE ONLY "public"."categoria"
    ADD CONSTRAINT "pk_categoria" PRIMARY KEY ("id_categoria");



ALTER TABLE ONLY "public"."ciudad"
    ADD CONSTRAINT "pk_ciudad" PRIMARY KEY ("id_ciudad");



ALTER TABLE ONLY "public"."cliente"
    ADD CONSTRAINT "pk_cliente" PRIMARY KEY ("id_cliente");



ALTER TABLE ONLY "public"."composicion"
    ADD CONSTRAINT "pk_composicion" PRIMARY KEY ("codigo_producto", "id_monodroga");



ALTER TABLE ONLY "public"."descuento"
    ADD CONSTRAINT "pk_descuento" PRIMARY KEY ("id_descuento");



ALTER TABLE ONLY "public"."detalle_venta"
    ADD CONSTRAINT "pk_detalle_venta" PRIMARY KEY ("id_detalle");



ALTER TABLE ONLY "public"."empleado"
    ADD CONSTRAINT "pk_empleado" PRIMARY KEY ("id_empleado");



ALTER TABLE ONLY "public"."factura"
    ADD CONSTRAINT "pk_factura" PRIMARY KEY ("id_factura");



ALTER TABLE ONLY "public"."farmacia"
    ADD CONSTRAINT "pk_farmacia" PRIMARY KEY ("id_farmacia");



ALTER TABLE ONLY "public"."laboratorio"
    ADD CONSTRAINT "pk_laboratorio" PRIMARY KEY ("id_laboratorio");



ALTER TABLE ONLY "public"."lote"
    ADD CONSTRAINT "pk_lote" PRIMARY KEY ("id_lote");



ALTER TABLE ONLY "public"."medicamento"
    ADD CONSTRAINT "pk_medicamento" PRIMARY KEY ("codigo_producto");



ALTER TABLE ONLY "public"."monodroga"
    ADD CONSTRAINT "pk_monodroga" PRIMARY KEY ("id_monodroga");



ALTER TABLE ONLY "public"."producto"
    ADD CONSTRAINT "pk_producto" PRIMARY KEY ("codigo_producto");



ALTER TABLE ONLY "public"."producto_proveedor"
    ADD CONSTRAINT "pk_producto_proveedor" PRIMARY KEY ("codigo_producto", "id_proveedor");



ALTER TABLE ONLY "public"."proveedor"
    ADD CONSTRAINT "pk_proveedor" PRIMARY KEY ("id_proveedor");



ALTER TABLE ONLY "public"."receta_medica"
    ADD CONSTRAINT "pk_receta_medica" PRIMARY KEY ("id_receta");



ALTER TABLE ONLY "public"."rol"
    ADD CONSTRAINT "pk_rol" PRIMARY KEY ("id_rol");



ALTER TABLE ONLY "public"."salario"
    ADD CONSTRAINT "pk_salario" PRIMARY KEY ("id_salario");



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "pk_stock" PRIMARY KEY ("id_farmacia", "codigo_producto");



ALTER TABLE ONLY "public"."turno"
    ADD CONSTRAINT "pk_turno" PRIMARY KEY ("id_turno");



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "pk_usuario" PRIMARY KEY ("id_usuario");



ALTER TABLE ONLY "public"."venta"
    ADD CONSTRAINT "pk_venta" PRIMARY KEY ("id_venta");



ALTER TABLE ONLY "public"."factura"
    ADD CONSTRAINT "uq_factura_venta" UNIQUE ("id_venta");



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "uq_usuario_empleado" UNIQUE ("id_empleado");



CREATE INDEX "almacena_fk" ON "public"."stock" USING "btree" ("id_farmacia");



CREATE INDEX "aplica_fk" ON "public"."descuento" USING "btree" ("codigo_producto");



CREATE UNIQUE INDEX "asignacion_farmaceutico_pk" ON "public"."asignacion_farmaceutico" USING "btree" ("id_asignacion");



CREATE UNIQUE INDEX "asignacion_turno_pk" ON "public"."asignacion_turno" USING "btree" ("id_asignacion_turno");



CREATE INDEX "atiende_fk" ON "public"."venta" USING "btree" ("id_empleado");



CREATE UNIQUE INDEX "auditoria_pk" ON "public"."auditoria" USING "btree" ("id_auditoria");



CREATE UNIQUE INDEX "cargo_pk" ON "public"."cargo" USING "btree" ("id_cargo");



CREATE UNIQUE INDEX "categoria_pk" ON "public"."categoria" USING "btree" ("id_categoria");



CREATE UNIQUE INDEX "ciudad_pk" ON "public"."ciudad" USING "btree" ("id_ciudad");



CREATE INDEX "clasifica_fk" ON "public"."producto" USING "btree" ("id_categoria");



CREATE UNIQUE INDEX "cliente_pk" ON "public"."cliente" USING "btree" ("id_cliente");



CREATE UNIQUE INDEX "composicion_pk" ON "public"."composicion" USING "btree" ("codigo_producto", "id_monodroga");



CREATE INDEX "contiene_fk" ON "public"."composicion" USING "btree" ("codigo_producto");



CREATE INDEX "cumple_fk" ON "public"."asignacion_turno" USING "btree" ("id_empleado");



CREATE UNIQUE INDEX "descuento_pk" ON "public"."descuento" USING "btree" ("id_descuento");



CREATE INDEX "desempena_fk" ON "public"."empleado" USING "btree" ("id_cargo");



CREATE UNIQUE INDEX "detalle_venta_pk" ON "public"."detalle_venta" USING "btree" ("id_detalle");



CREATE INDEX "disponible_en_fk" ON "public"."stock" USING "btree" ("codigo_producto");



CREATE INDEX "ejecuta_fk" ON "public"."auditoria" USING "btree" ("id_usuario");



CREATE INDEX "ejerce_como_fk" ON "public"."asignacion_farmaceutico" USING "btree" ("id_empleado");



CREATE INDEX "emplea_fk" ON "public"."empleado" USING "btree" ("id_farmacia");



CREATE UNIQUE INDEX "empleado_pk" ON "public"."empleado" USING "btree" ("id_empleado");



CREATE INDEX "es_provisto_fk" ON "public"."producto_proveedor" USING "btree" ("codigo_producto");



CREATE INDEX "es_vendido_fk" ON "public"."detalle_venta" USING "btree" ("codigo_producto");



CREATE INDEX "fabrica_fk" ON "public"."medicamento" USING "btree" ("id_laboratorio");



CREATE UNIQUE INDEX "factura_pk" ON "public"."factura" USING "btree" ("id_factura");



CREATE UNIQUE INDEX "farmacia_pk" ON "public"."farmacia" USING "btree" ("id_farmacia");



CREATE INDEX "forma_parte_fk" ON "public"."composicion" USING "btree" ("id_monodroga");



CREATE INDEX "genera_fk" ON "public"."factura" USING "btree" ("id_venta");



CREATE INDEX "incluye_fk" ON "public"."detalle_venta" USING "btree" ("id_venta");



CREATE UNIQUE INDEX "laboratorio_pk" ON "public"."laboratorio" USING "btree" ("id_laboratorio");



CREATE UNIQUE INDEX "lote_pk" ON "public"."lote" USING "btree" ("id_lote");



CREATE UNIQUE INDEX "medicamento_pk" ON "public"."medicamento" USING "btree" ("codigo_producto");



CREATE UNIQUE INDEX "monodroga_pk" ON "public"."monodroga" USING "btree" ("id_monodroga");



CREATE INDEX "posee_fk" ON "public"."lote" USING "btree" ("codigo_producto");



CREATE UNIQUE INDEX "producto_pk" ON "public"."producto" USING "btree" ("codigo_producto");



CREATE UNIQUE INDEX "producto_proveedor_pk" ON "public"."producto_proveedor" USING "btree" ("codigo_producto", "id_proveedor");



CREATE UNIQUE INDEX "proveedor_pk" ON "public"."proveedor" USING "btree" ("id_proveedor");



CREATE INDEX "realiza_fk" ON "public"."venta" USING "btree" ("id_cliente");



CREATE UNIQUE INDEX "receta_medica_pk" ON "public"."receta_medica" USING "btree" ("id_receta");



CREATE INDEX "recibe_fk" ON "public"."salario" USING "btree" ("id_empleado");



CREATE INDEX "registra_fk" ON "public"."stock" USING "btree" ("id_lote");



CREATE INDEX "requiere_fk" ON "public"."receta_medica" USING "btree" ("id_venta");



CREATE INDEX "requiere_titular_fk" ON "public"."asignacion_farmaceutico" USING "btree" ("id_ciudad");



CREATE UNIQUE INDEX "rol_pk" ON "public"."rol" USING "btree" ("id_rol");



CREATE UNIQUE INDEX "salario_pk" ON "public"."salario" USING "btree" ("id_salario");



CREATE INDEX "se_le_asigna_fk" ON "public"."usuario" USING "btree" ("id_empleado");



CREATE INDEX "se_programa_en_fk" ON "public"."asignacion_turno" USING "btree" ("id_turno");



CREATE UNIQUE INDEX "stock_pk" ON "public"."stock" USING "btree" ("id_farmacia", "codigo_producto");



CREATE INDEX "suministra_fk" ON "public"."producto_proveedor" USING "btree" ("id_proveedor");



CREATE INDEX "tiene_asignado_fk" ON "public"."usuario" USING "btree" ("id_rol");



CREATE INDEX "tiene_fk" ON "public"."farmacia" USING "btree" ("id_ciudad");



CREATE UNIQUE INDEX "turno_pk" ON "public"."turno" USING "btree" ("id_turno");



CREATE UNIQUE INDEX "usuario_pk" ON "public"."usuario" USING "btree" ("id_usuario");



CREATE UNIQUE INDEX "venta_pk" ON "public"."venta" USING "btree" ("id_venta");



ALTER TABLE ONLY "public"."asignacion_turno"
    ADD CONSTRAINT "fk_asignaci_cumple_empleado" FOREIGN KEY ("id_empleado") REFERENCES "public"."empleado"("id_empleado") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."asignacion_farmaceutico"
    ADD CONSTRAINT "fk_asignaci_ejerce_co_empleado" FOREIGN KEY ("id_empleado") REFERENCES "public"."empleado"("id_empleado") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."asignacion_farmaceutico"
    ADD CONSTRAINT "fk_asignaci_requiere__ciudad" FOREIGN KEY ("id_ciudad") REFERENCES "public"."ciudad"("id_ciudad") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."asignacion_turno"
    ADD CONSTRAINT "fk_asignaci_se_progra_turno" FOREIGN KEY ("id_turno") REFERENCES "public"."turno"("id_turno") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."auditoria"
    ADD CONSTRAINT "fk_auditori_ejecuta_usuario" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuario"("id_usuario") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."composicion"
    ADD CONSTRAINT "fk_composic_contiene_medicame" FOREIGN KEY ("codigo_producto") REFERENCES "public"."medicamento"("codigo_producto") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."composicion"
    ADD CONSTRAINT "fk_composic_forma_par_monodrog" FOREIGN KEY ("id_monodroga") REFERENCES "public"."monodroga"("id_monodroga") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."descuento"
    ADD CONSTRAINT "fk_descuent_aplica_producto" FOREIGN KEY ("codigo_producto") REFERENCES "public"."producto"("codigo_producto") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."detalle_venta"
    ADD CONSTRAINT "fk_detalle__es_vendid_producto" FOREIGN KEY ("codigo_producto") REFERENCES "public"."producto"("codigo_producto") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."detalle_venta"
    ADD CONSTRAINT "fk_detalle__incluye_venta" FOREIGN KEY ("id_venta") REFERENCES "public"."venta"("id_venta") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."empleado"
    ADD CONSTRAINT "fk_empleado_desempena_cargo" FOREIGN KEY ("id_cargo") REFERENCES "public"."cargo"("id_cargo") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."empleado"
    ADD CONSTRAINT "fk_empleado_emplea_farmacia" FOREIGN KEY ("id_farmacia") REFERENCES "public"."farmacia"("id_farmacia") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."factura"
    ADD CONSTRAINT "fk_factura_genera_venta" FOREIGN KEY ("id_venta") REFERENCES "public"."venta"("id_venta") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."farmacia"
    ADD CONSTRAINT "fk_farmacia_tiene_ciudad" FOREIGN KEY ("id_ciudad") REFERENCES "public"."ciudad"("id_ciudad") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lote"
    ADD CONSTRAINT "fk_lote_posee_producto" FOREIGN KEY ("codigo_producto") REFERENCES "public"."producto"("codigo_producto") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."medicamento"
    ADD CONSTRAINT "fk_medicame_es_un_producto" FOREIGN KEY ("codigo_producto") REFERENCES "public"."producto"("codigo_producto") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."medicamento"
    ADD CONSTRAINT "fk_medicame_fabrica_laborato" FOREIGN KEY ("id_laboratorio") REFERENCES "public"."laboratorio"("id_laboratorio") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."producto"
    ADD CONSTRAINT "fk_producto_clasifica_categori" FOREIGN KEY ("id_categoria") REFERENCES "public"."categoria"("id_categoria") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."producto_proveedor"
    ADD CONSTRAINT "fk_producto_es_provis_producto" FOREIGN KEY ("codigo_producto") REFERENCES "public"."producto"("codigo_producto") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."producto_proveedor"
    ADD CONSTRAINT "fk_producto_suministr_proveedo" FOREIGN KEY ("id_proveedor") REFERENCES "public"."proveedor"("id_proveedor") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."receta_medica"
    ADD CONSTRAINT "fk_receta_m_requiere_venta" FOREIGN KEY ("id_venta") REFERENCES "public"."venta"("id_venta") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."salario"
    ADD CONSTRAINT "fk_salario_recibe_empleado" FOREIGN KEY ("id_empleado") REFERENCES "public"."empleado"("id_empleado") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "fk_stock_almacena_farmacia" FOREIGN KEY ("id_farmacia") REFERENCES "public"."farmacia"("id_farmacia") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "fk_stock_disponibl_producto" FOREIGN KEY ("codigo_producto") REFERENCES "public"."producto"("codigo_producto") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."stock"
    ADD CONSTRAINT "fk_stock_registra_lote" FOREIGN KEY ("id_lote") REFERENCES "public"."lote"("id_lote") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "fk_usuario_se_le_asi_empleado" FOREIGN KEY ("id_empleado") REFERENCES "public"."empleado"("id_empleado") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."usuario"
    ADD CONSTRAINT "fk_usuario_tiene_asi_rol" FOREIGN KEY ("id_rol") REFERENCES "public"."rol"("id_rol") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."venta"
    ADD CONSTRAINT "fk_venta_atiende_empleado" FOREIGN KEY ("id_empleado") REFERENCES "public"."empleado"("id_empleado") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."venta"
    ADD CONSTRAINT "fk_venta_realiza_cliente" FOREIGN KEY ("id_cliente") REFERENCES "public"."cliente"("id_cliente") ON UPDATE RESTRICT ON DELETE RESTRICT;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON PROCEDURE "public"."hello"() TO "anon";
GRANT ALL ON PROCEDURE "public"."hello"() TO "authenticated";
GRANT ALL ON PROCEDURE "public"."hello"() TO "service_role";



GRANT ALL ON PROCEDURE "public"."mostrar_producto"(IN "p_id_producto" integer, OUT "p_nombre" character varying) TO "anon";
GRANT ALL ON PROCEDURE "public"."mostrar_producto"(IN "p_id_producto" integer, OUT "p_nombre" character varying) TO "authenticated";
GRANT ALL ON PROCEDURE "public"."mostrar_producto"(IN "p_id_producto" integer, OUT "p_nombre" character varying) TO "service_role";



GRANT ALL ON PROCEDURE "public"."proc_in"(INOUT "varl" integer) TO "anon";
GRANT ALL ON PROCEDURE "public"."proc_in"(INOUT "varl" integer) TO "authenticated";
GRANT ALL ON PROCEDURE "public"."proc_in"(INOUT "varl" integer) TO "service_role";



GRANT ALL ON TABLE "public"."asignacion_farmaceutico" TO "anon";
GRANT ALL ON TABLE "public"."asignacion_farmaceutico" TO "authenticated";
GRANT ALL ON TABLE "public"."asignacion_farmaceutico" TO "service_role";



GRANT ALL ON TABLE "public"."asignacion_turno" TO "anon";
GRANT ALL ON TABLE "public"."asignacion_turno" TO "authenticated";
GRANT ALL ON TABLE "public"."asignacion_turno" TO "service_role";



GRANT ALL ON TABLE "public"."auditoria" TO "anon";
GRANT ALL ON TABLE "public"."auditoria" TO "authenticated";
GRANT ALL ON TABLE "public"."auditoria" TO "service_role";



GRANT ALL ON TABLE "public"."cargo" TO "anon";
GRANT ALL ON TABLE "public"."cargo" TO "authenticated";
GRANT ALL ON TABLE "public"."cargo" TO "service_role";



GRANT ALL ON TABLE "public"."categoria" TO "anon";
GRANT ALL ON TABLE "public"."categoria" TO "authenticated";
GRANT ALL ON TABLE "public"."categoria" TO "service_role";



GRANT ALL ON TABLE "public"."ciudad" TO "anon";
GRANT ALL ON TABLE "public"."ciudad" TO "authenticated";
GRANT ALL ON TABLE "public"."ciudad" TO "service_role";



GRANT ALL ON TABLE "public"."cliente" TO "anon";
GRANT ALL ON TABLE "public"."cliente" TO "authenticated";
GRANT ALL ON TABLE "public"."cliente" TO "service_role";



GRANT ALL ON TABLE "public"."composicion" TO "anon";
GRANT ALL ON TABLE "public"."composicion" TO "authenticated";
GRANT ALL ON TABLE "public"."composicion" TO "service_role";



GRANT ALL ON TABLE "public"."descuento" TO "anon";
GRANT ALL ON TABLE "public"."descuento" TO "authenticated";
GRANT ALL ON TABLE "public"."descuento" TO "service_role";



GRANT ALL ON TABLE "public"."detalle_venta" TO "anon";
GRANT ALL ON TABLE "public"."detalle_venta" TO "authenticated";
GRANT ALL ON TABLE "public"."detalle_venta" TO "service_role";



GRANT ALL ON TABLE "public"."empleado" TO "anon";
GRANT ALL ON TABLE "public"."empleado" TO "authenticated";
GRANT ALL ON TABLE "public"."empleado" TO "service_role";



GRANT ALL ON TABLE "public"."factura" TO "anon";
GRANT ALL ON TABLE "public"."factura" TO "authenticated";
GRANT ALL ON TABLE "public"."factura" TO "service_role";



GRANT ALL ON TABLE "public"."farmacia" TO "anon";
GRANT ALL ON TABLE "public"."farmacia" TO "authenticated";
GRANT ALL ON TABLE "public"."farmacia" TO "service_role";



GRANT ALL ON TABLE "public"."laboratorio" TO "anon";
GRANT ALL ON TABLE "public"."laboratorio" TO "authenticated";
GRANT ALL ON TABLE "public"."laboratorio" TO "service_role";



GRANT ALL ON TABLE "public"."lote" TO "anon";
GRANT ALL ON TABLE "public"."lote" TO "authenticated";
GRANT ALL ON TABLE "public"."lote" TO "service_role";



GRANT ALL ON TABLE "public"."medicamento" TO "anon";
GRANT ALL ON TABLE "public"."medicamento" TO "authenticated";
GRANT ALL ON TABLE "public"."medicamento" TO "service_role";



GRANT ALL ON TABLE "public"."monodroga" TO "anon";
GRANT ALL ON TABLE "public"."monodroga" TO "authenticated";
GRANT ALL ON TABLE "public"."monodroga" TO "service_role";



GRANT ALL ON TABLE "public"."producto" TO "anon";
GRANT ALL ON TABLE "public"."producto" TO "authenticated";
GRANT ALL ON TABLE "public"."producto" TO "service_role";



GRANT ALL ON TABLE "public"."producto_proveedor" TO "anon";
GRANT ALL ON TABLE "public"."producto_proveedor" TO "authenticated";
GRANT ALL ON TABLE "public"."producto_proveedor" TO "service_role";



GRANT ALL ON TABLE "public"."proveedor" TO "anon";
GRANT ALL ON TABLE "public"."proveedor" TO "authenticated";
GRANT ALL ON TABLE "public"."proveedor" TO "service_role";



GRANT ALL ON TABLE "public"."receta_medica" TO "anon";
GRANT ALL ON TABLE "public"."receta_medica" TO "authenticated";
GRANT ALL ON TABLE "public"."receta_medica" TO "service_role";



GRANT ALL ON TABLE "public"."rol" TO "anon";
GRANT ALL ON TABLE "public"."rol" TO "authenticated";
GRANT ALL ON TABLE "public"."rol" TO "service_role";



GRANT ALL ON TABLE "public"."salario" TO "anon";
GRANT ALL ON TABLE "public"."salario" TO "authenticated";
GRANT ALL ON TABLE "public"."salario" TO "service_role";



GRANT ALL ON TABLE "public"."stock" TO "anon";
GRANT ALL ON TABLE "public"."stock" TO "authenticated";
GRANT ALL ON TABLE "public"."stock" TO "service_role";



GRANT ALL ON TABLE "public"."turno" TO "anon";
GRANT ALL ON TABLE "public"."turno" TO "authenticated";
GRANT ALL ON TABLE "public"."turno" TO "service_role";



GRANT ALL ON TABLE "public"."usuario" TO "anon";
GRANT ALL ON TABLE "public"."usuario" TO "authenticated";
GRANT ALL ON TABLE "public"."usuario" TO "service_role";



GRANT ALL ON TABLE "public"."venta" TO "anon";
GRANT ALL ON TABLE "public"."venta" TO "authenticated";
GRANT ALL ON TABLE "public"."venta" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







