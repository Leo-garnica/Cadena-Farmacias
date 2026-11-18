DO $$ BEGIN
  IF current_database() <> 'vitafarma_gestion' THEN RAISE EXCEPTION 'Destino incorrecto'; END IF;
END $$;
SELECT 'CREATE ROLE vf_gestion LOGIN' WHERE NOT EXISTS
  (SELECT FROM pg_roles WHERE rolname='vf_gestion') \gexec
ALTER ROLE vf_gestion PASSWORD :'writer_password';
REVOKE ALL ON DATABASE vitafarma_gestion FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE vitafarma_gestion TO vf_lector, vf_gestion;
GRANT USAGE ON SCHEMA public TO vf_lector, vf_gestion;
GRANT SELECT ON public.farmacia, public.ciudad, public.categoria, public.producto, public.stock, public.lote, public.medicamento TO vf_lector;
CREATE SCHEMA practica_api;
CREATE TABLE practica_api.instalacion (version text PRIMARY KEY);
INSERT INTO practica_api.instalacion VALUES ('VF-GESTION-LOCAL-1');
CREATE TABLE practica_api.operacion_venta (
  operacion uuid PRIMARY KEY, actor uuid NOT NULL, contenido text NOT NULL, venta integer NOT NULL REFERENCES public.venta
);
CREATE SEQUENCE practica_api.identificador AS integer START WITH 100000;
GRANT USAGE ON SCHEMA practica_api TO vf_gestion;
GRANT USAGE ON SEQUENCE practica_api.identificador TO vf_gestion;
GRANT SELECT ON practica_api.instalacion TO vf_gestion;
GRANT SELECT, INSERT ON practica_api.operacion_venta TO vf_gestion;
GRANT SELECT ON public.ciudad,public.cargo,public.categoria,public.laboratorio,public.rol,public.stock TO vf_gestion;
GRANT UPDATE(cantidad) ON public.stock TO vf_gestion;
GRANT SELECT,INSERT ON public.venta,public.detalle_venta TO vf_gestion;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.farmacia,public.empleado,public.producto,public.medicamento,public.cliente,public.descuento,public.salario TO vf_gestion;
GRANT SELECT(id_usuario,id_rol,id_empleado,nombre_usuario,estado), INSERT, UPDATE(id_rol,id_empleado,nombre_usuario,estado), DELETE ON public.usuario TO vf_gestion;
INSERT INTO public.cargo (id_cargo,nombre) VALUES (1,'Atención de práctica'),(2,'Responsable de práctica');
INSERT INTO public.empleado (id_empleado,id_cargo,id_farmacia,nombre_completo) VALUES
  (1,1,1,'Persona de práctica A'),(2,1,2,'Persona de práctica B');
INSERT INTO public.rol (id_rol,nombre_rol) VALUES (1,'Consulta'),(2,'Responsable');
INSERT INTO public.cliente (id_cliente,nombres,apellidos) VALUES (1,'Cliente','de práctica');
