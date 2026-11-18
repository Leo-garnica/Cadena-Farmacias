\set ON_ERROR_STOP on
-- Ejecutar como vf_lector; los valores de referencia se cuentan en el dataset, fuera de la API.
DO $$
DECLARE
  registros integer;
  unidades integer;
  ceros integer;
  sin_cantidad integer;
BEGIN
  IF current_database() <> 'vitafarma_practica' OR current_user <> 'vf_lector' THEN
    RAISE EXCEPTION 'Destino o identidad incorrectos';
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = current_user AND
    (rolsuper OR rolcreaterole OR rolcreatedb OR rolreplication OR rolbypassrls)) OR
    EXISTS (SELECT FROM pg_roles WHERE rolname <> current_user AND pg_has_role(current_user, oid, 'MEMBER')) THEN
    RAISE EXCEPTION 'El lector posee privilegios o membresías adicionales';
  END IF;
  IF has_database_privilege(current_user, current_database(), 'CREATE,TEMP') OR
     has_schema_privilege(current_user, 'public', 'CREATE') OR has_schema_privilege(current_user, 'auth', 'USAGE') OR
     EXISTS (SELECT FROM pg_class t JOIN pg_namespace n ON n.oid=t.relnamespace
             WHERE n.nspname='public' AND t.relkind='r' AND has_any_column_privilege(current_user,t.oid,'SELECT') AND
               t.relname NOT IN ('farmacia','ciudad','categoria','producto','stock','lote','medicamento')) OR
     EXISTS (SELECT FROM pg_class t JOIN pg_namespace n ON n.oid=t.relnamespace
             WHERE n.nspname='public' AND t.relkind='r' AND
               (has_table_privilege(current_user, t.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
                has_any_column_privilege(current_user, t.oid, 'INSERT,UPDATE,REFERENCES'))) THEN
    RAISE EXCEPTION 'El lector tiene escritura o acceso a datos restringidos';
  END IF;
  IF (SELECT count(*) FROM public.farmacia) <> 2 OR (SELECT count(*) FROM public.producto) <> 12 THEN
    RAISE EXCEPTION 'Cantidad de sucursales o catálogo incorrecta';
  END IF;
  SELECT count(*), sum(cantidad), count(*) FILTER (WHERE cantidad=0), count(*) FILTER (WHERE cantidad IS NULL)
    INTO registros, unidades, ceros, sin_cantidad FROM public.stock WHERE id_farmacia=1;
  IF (registros, unidades, ceros, sin_cantidad) <> (10,36,2,1) OR
     (SELECT count(*) FROM public.stock WHERE id_farmacia=2) <> 3 OR
     (SELECT count(*) FROM public.stock WHERE id_farmacia=1 AND id_lote IS NULL) <> 8 OR
     (SELECT count(*) FROM public.producto p WHERE NOT EXISTS
       (SELECT FROM public.stock s WHERE s.id_farmacia=1 AND s.codigo_producto=p.codigo_producto)) <> 2 THEN
    RAISE EXCEPTION 'No coincide el inventario con VF-PRACTICA-1';
  END IF;
  IF (SELECT count(*) FROM public.stock s JOIN public.lote l USING(id_lote)
      WHERE s.id_farmacia=1 AND l.fecha_vencimiento < (SELECT fecha_vencimiento FROM public.lote WHERE id_lote=3)) <> 1 THEN
    RAISE EXCEPTION 'El lote de referencia debe ser posterior a exactamente un lote en la primera sucursal';
  END IF;
END $$;
SELECT 'VF-PRACTICA-1' AS dataset, f.id_farmacia, count(s.codigo_producto) AS filas_stock,
       coalesce(sum(s.cantidad),0) AS unidades_conocidas
FROM public.farmacia f LEFT JOIN public.stock s USING (id_farmacia)
GROUP BY f.id_farmacia ORDER BY f.id_farmacia;

-- Incluso pidiendo una transacción de escritura, los privilegios siguen restringidos.
BEGIN READ WRITE;
DO $$
BEGIN
  BEGIN
    UPDATE public.stock SET cantidad = cantidad WHERE FALSE;
    RAISE EXCEPTION 'El lector podría actualizar stock';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM contrasena FROM public.usuario WHERE FALSE;
    RAISE EXCEPTION 'El lector podría consultar credenciales';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
ROLLBACK;
