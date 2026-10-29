-- =====================================================================
--  LLENADO MASIVO REALISTA — Cadena de farmacias en Bolivia (PostgreSQL 16)
--  Modelo: Farmacia_T2_corregido.cdm → PDM PostgreSQL → script de PowerDesigner
--  Datos de prueba: operaciones y contactos FICTICIOS, con apariencia boliviana.
--  Los medicamentos se basan en principios activos y formas de uso comunes;
--  8 nombres de laboratorios reales sirven solo como referencia de contexto.
--  NO se afirma que dichos laboratorios fabriquen los SKU simulados.
--  NIT, teléfonos, números de factura, matrículas y direcciones NO están verificados
--  ni son válidos para operaciones reales. Los precios en Bs son ESTIMACIONES SIMULADAS.
--
--  Cómo usarlo en DBeaver:
--    1. Abre una conexión a la base donde ya ejecutaste el script de PowerDesigner.
--    2. Abre este archivo en un editor SQL de esa base (arriba debe decir farmacia / public).
--    3. Ejecuta TODO el script con Alt+X  (Execute SQL Script), no con Ctrl+Enter.
--
--  ¡OJO! Vacía (TRUNCATE) las 27 tablas antes de llenarlas. Se puede volver a ejecutar
--  las veces que quieras; con la misma semilla genera siempre los mismos datos.
--  Se usa transacción: si falla una sentencia, ejecutar ROLLBACK y corregir.
--  Las cantidades se cambian en el bloque "1. CONFIGURACIÓN".
--  Antes de ejecutar, confirma que son 27 tablas y que estás en farmacia/public.
-- =====================================================================

BEGIN;
SET LOCAL search_path TO public, pg_temp;


-- ---------------------------------------------------------------------
-- 0. PREPARACIÓN DEL ESQUEMA
-- ---------------------------------------------------------------------

-- 0.1  Si PowerDesigner generó los nombres entre comillas con mayúsculas ("Ciudad", "ID_CIUDAD"),
--      se pasan a minúsculas para que se puedan escribir sin comillas.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT table_name FROM information_schema.tables
           WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'
             AND table_name <> lower(table_name) LOOP
    EXECUTE format('ALTER TABLE %I RENAME TO %I', r.table_name, lower(r.table_name));
  END LOOP;
  FOR r IN SELECT table_name, column_name FROM information_schema.columns
           WHERE table_schema = current_schema() AND column_name <> lower(column_name) LOOP
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', r.table_name, r.column_name, lower(r.column_name));
  END LOOP;
END $$;

-- 0.2  Comprueba que estén las 27 tablas y que las relaciones 1:1 se hayan generado bien.
DO $$
DECLARE faltan text;
BEGIN
  SELECT string_agg(t, ', ') INTO faltan
  FROM unnest(ARRAY['ciudad','farmacia','cargo','empleado','usuario','rol','turno','asignacion_turno',
                    'asignacion_farmaceutico','salario','categoria','proveedor','producto','producto_proveedor',
                    'laboratorio','medicamento','monodroga','composicion','lote','stock','cliente','venta',
                    'detalle_venta','descuento','factura','receta_medica','auditoria']) AS t
  WHERE to_regclass(current_schema() || '.' || t) IS NULL;
  IF faltan IS NOT NULL THEN
    RAISE EXCEPTION 'Faltan tablas en el esquema "%": %. Ejecuta primero el script que generó PowerDesigner.',
      current_schema(), faltan;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = 'empleado' AND column_name = 'id_usuario') THEN
    RAISE EXCEPTION 'empleado tiene una columna id_usuario: la relación 1:1 Se_le_asigna se generó en los dos sentidos. '
      'En el CDM: relación Se_le_asigna > Cardinalities > Dominant role = "Empleado to Usuario", y vuelve a generar.';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = 'venta' AND column_name = 'id_factura') THEN
    RAISE EXCEPTION 'venta tiene una columna id_factura: la relación 1:1 Genera se generó en los dos sentidos. '
      'En el CDM: relación Genera > Cardinalities > Dominant role = "Venta to Factura", y vuelve a generar.';
  END IF;
END $$;

-- Verificar columnas ANTES de borrar datos: el CDM/PDM podría ser distinto.
DO $$
DECLARE faltan text;
BEGIN
  WITH columnas(tabla, nombres) AS (VALUES
    ('ciudad',ARRAY['id_ciudad','nombre']),
    ('farmacia',ARRAY['id_farmacia','id_ciudad','nombre','direccion','telefono']),
    ('cargo',ARRAY['id_cargo','nombre','descripcion','sueldo_base']),
    ('empleado',ARRAY['id_empleado','id_farmacia','id_cargo','nombre_completo','direccion','fecha_nacimiento','fecha_ingreso','telefono','titulo_profesional']),
    ('usuario',ARRAY['id_usuario','id_rol','id_empleado','nombre_usuario','contrasena','estado']),
    ('rol',ARRAY['id_rol','nombre_rol','descripcion']),
    ('turno',ARRAY['id_turno','nombre','hora_inicio','hora_fin']),
    ('asignacion_turno',ARRAY['id_asignacion_turno','id_empleado','id_turno','fecha_inicio','fecha_fin']),
    ('asignacion_farmaceutico',ARRAY['id_asignacion','id_ciudad','id_empleado','fecha_inicio','fecha_fin']),
    ('salario',ARRAY['id_salario','id_empleado','sueldo_base','monto_antiguedad','bonos','descuentos','total_cobrar','fecha_elaboracion','fecha_cobro']),
    ('categoria',ARRAY['id_categoria','nombre','descripcion']),
    ('proveedor',ARRAY['id_proveedor','nombre','telefono','direccion']),
    ('producto',ARRAY['codigo_producto','id_categoria','nombre','descripcion','presentacion','precio_compra','precio_venta']),
    ('producto_proveedor',ARRAY['codigo_producto','id_proveedor','precio_acordado']),
    ('laboratorio',ARRAY['id_laboratorio','nombre','telefono','pais_origen']),
    ('medicamento',ARRAY['codigo_producto','id_laboratorio','accion_terapeutica','fecha_vencimiento']),
    ('monodroga',ARRAY['id_monodroga','nombre_sustancia','descripcion']),
    ('composicion',ARRAY['codigo_producto','id_monodroga','concentracion']),
    ('lote',ARRAY['id_lote','codigo_producto','codigo_alfanumerico','fecha_fabricacion','fecha_vencimiento']),
    ('stock',ARRAY['id_farmacia','codigo_producto','id_lote','cantidad']),
    ('cliente',ARRAY['id_cliente','nombres','apellidos','telefono','direccion','correo']),
    ('venta',ARRAY['id_venta','id_empleado','id_cliente','fecha_hora','total_cobrado']),
    ('detalle_venta',ARRAY['id_detalle','id_venta','codigo_producto','cantidad','precio_historico']),
    ('descuento',ARRAY['id_descuento','codigo_producto','descripcion','porcentaje','fecha_inicio','fecha_fin']),
    ('factura',ARRAY['id_factura','id_venta','nro_factura','nro_actualizacion','nit_cliente','razon_social','fecha_emision','codigo_control']),
    ('receta_medica',ARRAY['id_receta','id_venta','nombre_medico','matricula_medica','fecha_emision_receta','institucion_salud']),
    ('auditoria',ARRAY['id_auditoria','id_usuario','fecha_hora','accion','entidad_afectada','id_registro_afectado','detalle'])
  )
  SELECT string_agg(c.tabla || '.' || x.columna, ', ' ORDER BY c.tabla, x.columna)
    INTO faltan
  FROM columnas c
  CROSS JOIN LATERAL unnest(c.nombres) AS x(columna)
  LEFT JOIN information_schema.columns ic
    ON ic.table_schema = current_schema()
   AND ic.table_name = c.tabla AND ic.column_name = x.columna
  WHERE ic.column_name IS NULL;

  IF faltan IS NOT NULL THEN
    RAISE EXCEPTION 'Faltan columnas en el PDM: %. No se han vaciado las tablas.', faltan;
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- 1. CONFIGURACIÓN (cambia aquí las cantidades)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS pg_temp.cfg;
CREATE TEMP TABLE cfg AS SELECT
    40    AS farmacias,                 -- se reparten entre las 15 ciudades
    10    AS empleados_por_farmacia,    -- cada empleado recibe su usuario (1:1)
    30    AS laboratorios,
    25    AS proveedores,
    600   AS productos,                 -- 600 SKU diferentes; 60 % medicamentos
    3     AS lotes_por_producto,
    3000  AS clientes,
    30000 AS ventas,                    -- entre 1 y 4 productos por venta
    150   AS descuentos,
    10000 AS auditorias;

-- Semilla fija: mismos datos en cada ejecución (cámbiala para obtener otros)
DO $$ BEGIN PERFORM setseed(0.42); END $$;


-- ---------------------------------------------------------------------
-- 2. FUNCIONES AUXILIARES (temporales: desaparecen al cerrar la sesión)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.elegir(arr text[]) RETURNS text
LANGUAGE sql VOLATILE AS $$ SELECT arr[1 + floor(random() * cardinality(arr))::int] $$;

CREATE OR REPLACE FUNCTION pg_temp.entre(a int, b int) RETURNS int
LANGUAGE sql VOLATILE AS $$ SELECT a + floor(random() * (b - a + 1))::int $$;

-- Números ficticios: 8 dígitos y prefijo 6/7 (móvil boliviano).
CREATE OR REPLACE FUNCTION pg_temp.celular() RETURNS text
LANGUAGE sql VOLATILE AS $$
  SELECT (ARRAY['6','7'])[1 + floor(random() * 2)::int]
       || pg_temp.entre(1000000, 9999999)::text
$$;

-- Telefonía fija con prefijos regionales habituales (sin verificar abonados).
CREATE OR REPLACE FUNCTION pg_temp.telefono_fijo(ciudad_id int) RETURNS text
LANGUAGE sql VOLATILE AS $$
  SELECT (CASE WHEN ciudad_id IN (1,2,10,11) THEN '2'
               WHEN ciudad_id IN (6,7,8,13,14) THEN '3'
               ELSE '4' END)
         || '-' || pg_temp.entre(2000000, 4999999)::text
$$;

CREATE OR REPLACE FUNCTION pg_temp.sin_tildes(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$ SELECT translate(t, 'áéíóúÁÉÍÓÚñÑüÜ', 'aeiouAEIOUnNuU') $$;

CREATE OR REPLACE FUNCTION pg_temp.nombre(mujer boolean) RETURNS text
LANGUAGE sql VOLATILE AS $$ SELECT CASE WHEN mujer
  THEN pg_temp.elegir(ARRAY['Ana','María','Carla','Lucía','Patricia','Gabriela','Daniela','Valeria','Andrea',
         'Paola','Silvia','Verónica','Claudia','Rosa','Mónica','Natalia','Lorena','Camila','Fernanda','Jimena'])
  ELSE pg_temp.elegir(ARRAY['Juan','Carlos','Luis','Jorge','Marco','Diego','Fernando','Javier','Rodrigo',
         'Sergio','Álvaro','Mauricio','Gonzalo','Ricardo','Pablo','Andrés','Daniel','Miguel','Óscar','Raúl']) END $$;

CREATE OR REPLACE FUNCTION pg_temp.segundo_nombre(mujer boolean) RETURNS text
LANGUAGE sql VOLATILE AS $$ SELECT CASE WHEN mujer
  THEN pg_temp.elegir(ARRAY['Isabel','Alejandra','Beatriz','Elena','Cecilia','Teresa','Sofía','Victoria'])
  ELSE pg_temp.elegir(ARRAY['Alberto','Antonio','Ernesto','Eduardo','José','Manuel','Alejandro','Martín']) END $$;

CREATE OR REPLACE FUNCTION pg_temp.apellido() RETURNS text
LANGUAGE sql VOLATILE AS $$ SELECT pg_temp.elegir(ARRAY[
  'Quispe','Mamani','Flores','Rodríguez','Vargas','Choque','Gutiérrez','Rojas','Fernández','Torrez','Gonzáles',
  'López','Condori','Huanca','Villarroel','Mendoza','Arce','Camacho','Pérez','Rocha','Soliz','Zurita','Terrazas',
  'Montaño','Claros','Vásquez','Guzmán','Herbas','Orellana','Siles','Ledezma','Céspedes','Salazar','Paredes',
  'Ayala','Ríos','Medina','Antezana','Peredo','Coca']) $$;

CREATE OR REPLACE FUNCTION pg_temp.direccion() RETURNS text
LANGUAGE sql VOLATILE AS $$ SELECT pg_temp.elegir(ARRAY[
  'Av. Heroínas','Av. Ayacucho','Calle Jordán','Av. América','Av. Blanco Galindo','Calle Sucre',
  'Av. Libertador Bolívar','Calle 25 de Mayo','Av. Villazón','Calle Bolívar','Av. Petrolera','Calle Junín',
  'Av. Melchor Pérez','Av. Circunvalación','Calle Colombia','Av. Oquendo','Av. 6 de Agosto','Calle Potosí'])
  || ' N° ' || pg_temp.entre(10, 2500) $$;


-- ---------------------------------------------------------------------
-- 3. VACIAR TABLAS Y REFORZAR LAS RELACIONES 1:1
-- ATENCIÓN: solamente para una base de PRUEBAS. Borra todos los datos actuales.
-- ---------------------------------------------------------------------
TRUNCATE TABLE receta_medica, factura, detalle_venta, venta, descuento, stock, lote, composicion,
               medicamento, producto_proveedor, producto, monodroga, laboratorio, proveedor, categoria,
               auditoria, usuario, rol, asignacion_turno, turno, salario, asignacion_farmaceutico,
               empleado, cargo, cliente, farmacia, ciudad
RESTART IDENTITY CASCADE;

-- En el modelo, Empleado–Usuario y Venta–Factura son 1:1. La FK sola permite N, así que se agrega UNIQUE.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_usuario_empleado') THEN
    ALTER TABLE usuario ADD CONSTRAINT uq_usuario_empleado UNIQUE (id_empleado);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_factura_venta') THEN
    ALTER TABLE factura ADD CONSTRAINT uq_factura_venta UNIQUE (id_venta);
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- 4. CATÁLOGOS FIJOS
-- ---------------------------------------------------------------------
INSERT INTO ciudad (id_ciudad, nombre) VALUES
  (1,'La Paz'),(2,'El Alto'),(3,'Cochabamba'),(4,'Quillacollo'),(5,'Sacaba'),
  (6,'Santa Cruz de la Sierra'),(7,'Montero'),(8,'Warnes'),(9,'Sucre'),(10,'Oruro'),
  (11,'Potosí'),(12,'Tarija'),(13,'Trinidad'),(14,'Cobija'),(15,'Yacuiba');

INSERT INTO cargo (id_cargo, nombre, descripcion, sueldo_base) VALUES
  (1,'Regente farmacéutico','Responsable técnico de la sucursal ante la autoridad sanitaria',7500.00),
  (2,'Farmacéutico','Dispensación y orientación farmacéutica',6000.00),
  (3,'Auxiliar de farmacia','Atención en mostrador y reposición',3800.00),
  (4,'Cajero','Cobro y emisión de facturas',3500.00),
  (5,'Encargado de almacén','Recepción de pedidos, lotes y control de stock',4200.00),
  (6,'Administrador de sucursal','Gestión del personal y de la sucursal',8500.00);

INSERT INTO rol (id_rol, nombre_rol, descripcion) VALUES
  (1,'ADMINISTRADOR','Acceso total a la sucursal: personal, reportes y configuración'),
  (2,'REGENTE','Ventas, recetas médicas, lotes y vencimientos'),
  (3,'VENDEDOR','Registro de ventas y facturación'),
  (4,'ALMACEN','Ingreso de lotes, stock y proveedores');

INSERT INTO turno (id_turno, nombre, hora_inicio, hora_fin) VALUES
  (1,'Mañana','07:00','15:00'),
  (2,'Tarde','15:00','23:00'),
  (3,'Noche','23:00','07:00');

INSERT INTO categoria (id_categoria, nombre, descripcion) VALUES
  (1,'Analgésicos y antiinflamatorios','Alivio del dolor, fiebre e inflamación'),
  (2,'Antibióticos','Tratamiento de infecciones bacterianas (venta con receta)'),
  (3,'Antigripales y respiratorios','Resfrío, alergias, tos y vías respiratorias'),
  (4,'Gastrointestinales','Acidez, diarrea, náuseas y cólicos'),
  (5,'Cardiovasculares y metabólicos','Presión arterial, colesterol y diabetes'),
  (6,'Dermatológicos','Tratamientos de uso tópico para la piel'),
  (7,'Vitaminas y suplementos','Complementos nutricionales'),
  (8,'Cuidado personal','Higiene y cuidado diario'),
  (9,'Bebés y maternidad','Productos para el cuidado del bebé'),
  (10,'Material de curación','Insumos de primeros auxilios');

-- Monodrogas: 8 por cada categoría de medicamento (1 a 6)
DROP TABLE IF EXISTS pg_temp.tmp_monodroga;
CREATE TEMP TABLE tmp_monodroga (grupo int, slot int, sustancia text, descripcion text, dosis text, forma text);
INSERT INTO tmp_monodroga VALUES
  (1,1,'Paracetamol','Analgésico y antipirético','500 mg','tableta'),
  (1,2,'Ibuprofeno','Antiinflamatorio no esteroideo','400 mg','tableta'),
  (1,3,'Diclofenaco','Antiinflamatorio no esteroideo','50 mg','tableta'),
  (1,4,'Naproxeno','Antiinflamatorio no esteroideo','550 mg','tableta'),
  (1,5,'Ketorolaco','Analgésico potente','10 mg','tableta'),
  (1,6,'Metamizol','Analgésico y antipirético','500 mg','tableta'),
  (1,7,'Ácido acetilsalicílico','Analgésico y antiagregante','100 mg','tableta'),
  (1,8,'Meloxicam','Antiinflamatorio no esteroideo','15 mg','tableta'),
  (2,1,'Amoxicilina','Antibiótico betalactámico','500 mg','cápsula'),
  (2,2,'Azitromicina','Antibiótico macrólido','500 mg','tableta'),
  (2,3,'Ciprofloxacino','Antibiótico quinolona','500 mg','tableta'),
  (2,4,'Cefalexina','Antibiótico cefalosporina','500 mg','cápsula'),
  (2,5,'Claritromicina','Antibiótico macrólido','500 mg','tableta'),
  (2,6,'Doxiciclina','Antibiótico tetraciclina','100 mg','cápsula'),
  (2,7,'Clindamicina','Antibiótico lincosamida','300 mg','cápsula'),
  (2,8,'Levofloxacino','Antibiótico quinolona','500 mg','tableta'),
  (3,1,'Clorfenamina','Antihistamínico','4 mg','tableta'),
  (3,2,'Loratadina','Antihistamínico no sedante','10 mg','tableta'),
  (3,3,'Cetirizina','Antihistamínico','10 mg','tableta'),
  (3,4,'Fenilefrina','Descongestionante nasal','10 mg','tableta'),
  (3,5,'Dextrometorfano','Antitusivo','15 mg/5 ml','jarabe'),
  (3,6,'Ambroxol','Mucolítico','30 mg/5 ml','jarabe'),
  (3,7,'Salbutamol','Broncodilatador','100 mcg/dosis','inhalador'),
  (3,8,'Guaifenesina','Expectorante','100 mg/5 ml','jarabe'),
  (4,1,'Omeprazol','Inhibidor de la bomba de protones','20 mg','cápsula'),
  (4,2,'Esomeprazol','Inhibidor de la bomba de protones','40 mg','tableta'),
  (4,3,'Metoclopramida','Antiemético','10 mg','tableta'),
  (4,4,'Loperamida','Antidiarreico','2 mg','tableta'),
  (4,5,'Butilescopolamina','Antiespasmódico','10 mg','tableta'),
  (4,6,'Domperidona','Procinético','10 mg','tableta'),
  (4,7,'Simeticona','Antiflatulento','80 mg','tableta'),
  (4,8,'Sales de rehidratación oral','Rehidratante','27,9 g','sobre'),
  (5,1,'Losartán','Antihipertensivo','50 mg','tableta'),
  (5,2,'Enalapril','Antihipertensivo','10 mg','tableta'),
  (5,3,'Amlodipino','Antihipertensivo','5 mg','tableta'),
  (5,4,'Atenolol','Betabloqueante','50 mg','tableta'),
  (5,5,'Atorvastatina','Hipolipemiante','20 mg','tableta'),
  (5,6,'Hidroclorotiazida','Diurético','25 mg','tableta'),
  (5,7,'Clopidogrel','Antiagregante plaquetario','75 mg','tableta'),
  (5,8,'Metformina','Antidiabético oral','850 mg','tableta'),
  (6,1,'Clotrimazol','Antimicótico tópico','1 %','crema'),
  (6,2,'Betametasona','Corticoide tópico','0,05 %','crema'),
  (6,3,'Ketoconazol','Antimicótico tópico','2 %','crema'),
  (6,4,'Mupirocina','Antibiótico tópico','2 %','ungüento'),
  (6,5,'Aciclovir','Antiviral tópico','5 %','crema'),
  (6,6,'Hidrocortisona','Corticoide tópico','1 %','crema'),
  (6,7,'Sulfadiazina de plata','Cicatrizante y antibacteriano','1 %','crema'),
  (6,8,'Permetrina','Antiparasitario tópico','5 %','loción');

DROP TABLE IF EXISTS pg_temp.tmp_presentacion;
CREATE TEMP TABLE tmp_presentacion (forma text, variante int, texto text);
INSERT INTO tmp_presentacion VALUES
  ('tableta',0,'Caja x 10 tabletas'),('tableta',1,'Caja x 20 tabletas'),('tableta',2,'Caja x 30 tabletas'),
  ('cápsula',0,'Caja x 10 cápsulas'),('cápsula',1,'Caja x 20 cápsulas'),('cápsula',2,'Caja x 30 cápsulas'),
  ('jarabe',0,'Frasco 60 ml'),('jarabe',1,'Frasco 120 ml'),('jarabe',2,'Frasco 200 ml'),
  ('inhalador',0,'Inhalador 200 dosis'),('inhalador',1,'Inhalador 200 dosis + aerocámara'),('inhalador',2,'Inhalador 100 dosis'),
  ('sobre',0,'Caja x 10 sobres'),('sobre',1,'Caja x 25 sobres'),('sobre',2,'Sobre individual'),
  ('crema',0,'Tubo 15 g'),('crema',1,'Tubo 30 g'),('crema',2,'Tubo 60 g'),
  ('ungüento',0,'Tubo 15 g'),('ungüento',1,'Tubo 30 g'),('ungüento',2,'Tubo 60 g'),
  ('loción',0,'Frasco 60 ml'),('loción',1,'Frasco 120 ml'),('loción',2,'Frasco 240 ml');

DROP TABLE IF EXISTS pg_temp.tmp_otros;
CREATE TEMP TABLE tmp_otros (grupo int, slot int, nombre text, presentacion text);
INSERT INTO tmp_otros VALUES
  (7,1,'Vitamina C 1 g efervescente','Tubo x 10 tabletas'),(7,2,'Complejo B','Caja x 30 tabletas'),
  (7,3,'Multivitamínico adulto','Frasco x 30 cápsulas'),(7,4,'Calcio + Vitamina D3','Frasco x 60 tabletas'),
  (7,5,'Omega 3 1000 mg','Frasco x 60 cápsulas'),(7,6,'Hierro + Ácido fólico','Caja x 30 tabletas'),
  (7,7,'Zinc 50 mg','Frasco x 30 tabletas'),(7,8,'Magnesio 400 mg','Frasco x 60 tabletas'),
  (8,1,'Shampoo anticaspa','Frasco 400 ml'),(8,2,'Protector solar FPS 50','Frasco 120 ml'),
  (8,3,'Crema hidratante corporal','Pote 400 ml'),(8,4,'Jabón antibacterial','Barra 125 g'),
  (8,5,'Pasta dental con flúor','Tubo 90 g'),(8,6,'Enjuague bucal','Frasco 500 ml'),
  (8,7,'Desodorante roll-on','Frasco 50 ml'),(8,8,'Alcohol en gel 70 %','Frasco 250 ml'),
  (9,1,'Pañales talla M','Paquete x 30'),(9,2,'Pañales talla G','Paquete x 30'),
  (9,3,'Toallitas húmedas','Paquete x 80'),(9,4,'Crema antipañalitis','Tubo 60 g'),
  (9,5,'Leche de fórmula etapa 1','Lata 400 g'),(9,6,'Biberón 250 ml','Unidad'),
  (9,7,'Shampoo para bebé','Frasco 200 ml'),(9,8,'Aceite para bebé','Frasco 100 ml'),
  (10,1,'Gasa estéril 10x10 cm','Caja x 10 sobres'),(10,2,'Venda elástica 10 cm','Unidad'),
  (10,3,'Algodón hidrófilo','Paquete 100 g'),(10,4,'Alcohol medicinal 70 %','Frasco 500 ml'),
  (10,5,'Agua oxigenada 10 vol.','Frasco 120 ml'),(10,6,'Curitas','Caja x 20'),
  (10,7,'Jeringa descartable 5 ml','Unidad'),(10,8,'Termómetro digital','Unidad');

INSERT INTO monodroga (id_monodroga, nombre_sustancia, descripcion)
SELECT (grupo - 1) * 8 + slot, sustancia, descripcion FROM tmp_monodroga;

-- 8 ejemplos de laboratorios existentes en Bolivia y 22 nombres ficticios.
-- No se asocia aquí un medicamento comercial real a ningún fabricante.
INSERT INTO laboratorio (id_laboratorio, nombre, telefono, pais_origen)
SELECT g,
       CASE g
         WHEN 1 THEN 'Droguería INTI'
         WHEN 2 THEN 'Laboratorios Bagó de Bolivia S.A.'
         WHEN 3 THEN 'Laboratorios COFAR S.A.'
         WHEN 4 THEN 'Laboratorios Farmacéuticos LAFAR S.A.'
         WHEN 5 THEN 'Laboratorios VITA S.A.'
         WHEN 6 THEN 'Laboratorios IFA S.A.'
         WHEN 7 THEN 'Laboratorios Delta S.A.'
         WHEN 8 THEN 'Laboratorios CRESPAL S.A.'
         ELSE 'Laboratorios ' || (ARRAY[
           'Tunari Norte','Altiplano Salud','Andes Medic','Valle Claro','Oriente Farma',
           'Cordillera Salud','Paitití Farma','Mamoré Salud','SurAndino',
           'Sajama Farma','Los Valles','Monte Verde','BioAndes','Amanecer',
           'Illimani Farma','Amazonia Salud','Cumbre Médica','Río Grande',
           'Salud Integral','Horizonte','Nueva Esperanza','Tierra Alta'
         ])[g - 8] || ' S.R.L.'
       END,
       CASE WHEN g <= 8 THEN '2-' ELSE '4-' END || pg_temp.entre(2000000, 4999999)::text,
       'Bolivia'
FROM cfg c CROSS JOIN generate_series(1, c.laboratorios) AS g;

-- 25 distribuidores inventados, con nombres y contactos de aspecto comercial.
INSERT INTO proveedor (id_proveedor, nombre, telefono, direccion)
SELECT g,
       (ARRAY[
         'Distribuidora Farmacéutica del Valle S.R.L.',
         'Droguería Alto Andino S.R.L.',
         'Distribuidora Salud Total S.R.L.',
         'Comercial Farmavida S.R.L.',
         'Importadora Medisur Bolivia S.R.L.',
         'Distribuidora Médica Tunari S.R.L.',
         'Droguería San Gabriel S.R.L.',
         'Distribuidora Oriente Salud S.R.L.',
         'Comercial BioMed Andina S.R.L.',
         'Droguería Nuevo Horizonte S.R.L.',
         'Distribuidora Cumbre Farma S.R.L.',
         'Distribuciones Cordillera S.R.L.',
         'Importadora Vida Plena S.R.L.',
         'Distribuidora La Esperanza S.R.L.',
         'Droguería Unión del Sur S.R.L.',
         'Distribuidora Altiplano S.R.L.',
         'Comercial San Martín Farma S.R.L.',
         'Distribuidora Médica Paitití S.R.L.',
         'Importadora Farma Integral S.R.L.',
         'Droguería Nueva América S.R.L.',
         'Distribuidora Sierra Salud S.R.L.',
         'Comercial Farmacéutica del Norte S.R.L.',
         'Distribuidora Los Valles S.R.L.',
         'Droguería Central de Bolivia S.R.L.',
         'Distribuidora Vida y Salud S.R.L.'
       ])[g],
       pg_temp.celular(),
       pg_temp.direccion()
FROM cfg c CROSS JOIN generate_series(1, c.proveedores) AS g;

-- ---------------------------------------------------------------------
-- 5. FARMACIAS, PERSONAL Y USUARIOS
-- ---------------------------------------------------------------------
INSERT INTO farmacia (id_farmacia, id_ciudad, nombre, direccion, telefono)
SELECT g, ci.id_ciudad,
       'Farmacias Vida Plena - ' || ci.nombre || ' ' || lpad(row_number() OVER (PARTITION BY ci.id_ciudad ORDER BY g)::text, 2, '0'),
       pg_temp.direccion(),
       pg_temp.telefono_fijo(ci.id_ciudad)
FROM cfg c
CROSS JOIN generate_series(1, c.farmacias) AS g
JOIN ciudad ci ON ci.id_ciudad = 1 + (g - 1) % (SELECT count(*) FROM ciudad);

-- En cada sucursal: 1 administrador, 1 regente, 2 farmacéuticos, auxiliares, 2 cajeros y 1 de almacén
INSERT INTO empleado (id_empleado, id_farmacia, id_cargo, nombre_completo, direccion,
                      fecha_nacimiento, fecha_ingreso, telefono, titulo_profesional)
SELECT s.g, s.farmacia, s.cargo,
       pg_temp.nombre(s.mujer) || ' ' || pg_temp.apellido() || ' ' || pg_temp.apellido(),
       pg_temp.direccion(),
       s.nacimiento,
       LEAST(date '2025-06-30', GREATEST(date '2012-01-01', (s.nacimiento + interval '19 years')::date)
                                + pg_temp.entre(0, 3000)),
       pg_temp.celular(),
       CASE s.cargo WHEN 1 THEN 'Lic. en Bioquímica y Farmacia'
                    WHEN 2 THEN 'Lic. en Bioquímica y Farmacia'
                    WHEN 3 THEN 'Técnico Medio en Farmacia'
                    WHEN 6 THEN 'Lic. en Administración de Empresas' END
FROM (
  SELECT g,
         1 + (g - 1) / c.empleados_por_farmacia AS farmacia,
         CASE (g - 1) % c.empleados_por_farmacia
              WHEN 0 THEN 6 WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 2
              WHEN 7 THEN 4 WHEN 8 THEN 4 WHEN 9 THEN 5 ELSE 3 END AS cargo,
         date '1965-01-01' + pg_temp.entre(0, 365 * 37) AS nacimiento,
         random() < 0.55 AS mujer
  FROM cfg c CROSS JOIN generate_series(1, c.farmacias * c.empleados_por_farmacia) AS g
) s;

-- Un usuario por empleado (relación 1:1 obligatoria). El rol sale del cargo.
INSERT INTO usuario (id_usuario, id_rol, id_empleado, nombre_usuario, contrasena, estado)
SELECT e.id_empleado,
       CASE e.id_cargo WHEN 6 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 2 WHEN 5 THEN 4 ELSE 3 END,
       e.id_empleado,
       lower(pg_temp.sin_tildes(split_part(e.nombre_completo, ' ', 1) || '.' || split_part(e.nombre_completo, ' ', 2)))
         || e.id_empleado,
       md5('Farmacia#' || e.id_empleado),          -- hash de ejemplo, no es una contraseña real
       CASE WHEN random() < 0.93 THEN 'ACTIVO' WHEN random() < 0.5 THEN 'INACTIVO' ELSE 'BLOQUEADO' END
FROM empleado e;

-- 4 periodos trimestrales de turnos por empleado (oct-2025 a sep-2026)
INSERT INTO asignacion_turno (id_asignacion_turno, id_empleado, id_turno, fecha_inicio, fecha_fin)
SELECT row_number() OVER (ORDER BY e.id_empleado, t.k),
       e.id_empleado,
       pg_temp.entre(1, 3),
       (date '2025-10-01' + make_interval(months => 3 * (t.k - 1)))::date,
       (date '2025-10-01' + make_interval(months => 3 * t.k) - interval '1 day')::date
FROM empleado e CROSS JOIN generate_series(1, 4) AS t(k);

-- Farmacéutico titular por ciudad: 3 periodos (2024, 2025 y el vigente desde 2026)
INSERT INTO asignacion_farmaceutico (id_asignacion, id_ciudad, id_empleado, fecha_inicio, fecha_fin)
SELECT row_number() OVER (ORDER BY x.id_ciudad, x.periodo),
       x.id_ciudad, x.id_empleado,
       make_date(2023 + x.periodo::int, 1, 1),
       CASE WHEN x.periodo < 3 THEN make_date(2023 + x.periodo::int, 12, 31) END
FROM (
  SELECT f.id_ciudad, e.id_empleado,
         row_number() OVER (PARTITION BY f.id_ciudad ORDER BY random()) AS periodo
  FROM empleado e JOIN farmacia f ON f.id_farmacia = e.id_farmacia
  WHERE e.id_cargo IN (1, 2)
) x
WHERE x.periodo <= 3;

-- 12 planillas por empleado. Aporte laboral aprox. 12,71 %; antigüedad según años de servicio.
INSERT INTO salario (id_salario, id_empleado, sueldo_base, monto_antiguedad, bonos, descuentos,
                     total_cobrar, fecha_elaboracion, fecha_cobro)
SELECT row_number() OVER (ORDER BY s.id_empleado, s.fe),
       s.id_empleado, s.base, s.antig, s.bonos,
       round((s.base + s.antig + s.bonos) * 0.1271, 2),
       s.base + s.antig + s.bonos - round((s.base + s.antig + s.bonos) * 0.1271, 2),
       s.fe, s.fe + 3
FROM (
  SELECT x.id_empleado, x.base, x.fe,
         round(x.base * CASE WHEN x.anios < 2 THEN 0 WHEN x.anios < 5 THEN 0.05 WHEN x.anios < 8 THEN 0.11
                             WHEN x.anios < 11 THEN 0.18 WHEN x.anios < 15 THEN 0.26 ELSE 0.34 END, 2) AS antig,
         (ARRAY[0, 0, 150, 300])[1 + floor(random() * 4)::int]::numeric AS bonos
  FROM (
    SELECT e.id_empleado, ca.sueldo_base AS base,
           (date '2025-10-01' + make_interval(months => m.k + 1) - interval '1 day')::date AS fe,
           extract(year FROM age((date '2025-10-01' + make_interval(months => m.k + 1))::date, e.fecha_ingreso)) AS anios
    FROM empleado e
    JOIN cargo ca ON ca.id_cargo = e.id_cargo
    CROSS JOIN generate_series(0, 11) AS m(k)
  ) x
) s;


-- ---------------------------------------------------------------------
-- 6. PRODUCTOS, MEDICAMENTOS, LOTES Y STOCK
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS pg_temp.tmp_producto;
CREATE TEMP TABLE tmp_producto AS
SELECT g AS codigo,
       1 + (g - 1) % 10        AS cat,        -- categorías 1-6 = medicamentos
       1 + ((g - 1) / 10) % 8  AS slot,
       ((g - 1) / 80) % 3      AS variante,
       1 + ((g - 1) / 80)     AS linea
FROM cfg c CROSS JOIN generate_series(1, c.productos) AS g;

-- 600 productos distintos: 48 principios activos conocidos + 32 tipos de producto no farmacológico,
-- en presentaciones y líneas de DISTRIBUCIÓN FICTICIAS (NO marcas registradas verificadas).
-- La línea distingue SKU similares sin pretender que un laboratorio real los fabrique.
-- Precios referenciales SIMULADOS para Bolivia, en Bs; suben con presentación y tamaño.
INSERT INTO producto (codigo_producto, id_categoria, nombre, descripcion, presentacion, precio_compra, precio_venta)
SELECT t.codigo, t.cat,
       COALESCE(m.sustancia || ' ' || m.dosis, o.nombre) || ' - ' || b.linea,
       COALESCE(m.descripcion, ca.descripcion),
       CASE WHEN t.cat <= 6 THEN pr.texto
            WHEN t.variante = 0 THEN o.presentacion
            WHEN t.variante = 1 THEN 'Pack x 2 (' || o.presentacion || ')'
            ELSE 'Pack x 3 (' || o.presentacion || ')' END,
       round((precio.venta / 1.36)::numeric, 2),
       precio.venta
FROM tmp_producto t
JOIN categoria ca ON ca.id_categoria = t.cat
LEFT JOIN tmp_monodroga m ON t.cat <= 6 AND m.grupo = t.cat AND m.slot = t.slot
LEFT JOIN tmp_presentacion pr ON pr.forma = m.forma AND pr.variante = t.variante
LEFT JOIN tmp_otros o ON t.cat > 6 AND o.grupo = t.cat AND o.slot = t.slot
CROSS JOIN LATERAL (
  SELECT (ARRAY['Andes Salud','Valle Farma','Altiplano','Vida Sur',
                'Oriente Farma','San Gabriel','Cumbre','BoliviaCare'])[t.linea] AS linea
) b
CROSS JOIN LATERAL (
  SELECT CASE t.cat
           WHEN 1 THEN 7.0 + t.slot * 2.5      -- analgésicos
           WHEN 2 THEN 18.0 + t.slot * 5.0     -- antibióticos
           WHEN 3 THEN 11.0 + t.slot * 3.5     -- antigripales
           WHEN 4 THEN 8.0 + t.slot * 3.0      -- gastrointestinales
           WHEN 5 THEN 12.0 + t.slot * 4.0     -- cardiovasculares
           WHEN 6 THEN 17.0 + t.slot * 4.5     -- dermatológicos
           WHEN 7 THEN (ARRAY[22,25,52,55,78,35,28,42])[t.slot] -- suplementos
           WHEN 8 THEN (ARRAY[35,72,45,7,17,38,25,20])[t.slot] -- cuidado personal
           WHEN 9 THEN (ARRAY[78,90,25,39,110,30,27,24])[t.slot] -- bebés y maternidad
           ELSE (ARRAY[14,12,18,20,16,10,6,58])[t.slot] -- curaciones
         END AS base,
         CASE WHEN t.cat > 6 THEN (ARRAY[1.0,1.85,2.7])[t.variante + 1]
              WHEN m.forma IN ('tableta','cápsula') THEN (ARRAY[0.85,1.5,2.1])[t.variante + 1]
              WHEN m.forma IN ('crema','ungüento','loción') THEN (ARRAY[0.75,1.0,1.7])[t.variante + 1]
              WHEN m.forma = 'inhalador' THEN (ARRAY[1.0,1.45,0.85])[t.variante + 1]
              ELSE (ARRAY[0.8,1.2,1.7])[t.variante + 1]
         END AS factor
) tarifa
CROSS JOIN LATERAL (
  SELECT round((tarifa.base * tarifa.factor * (0.92 + t.linea * 0.025))::numeric, 2) AS venta
) precio;

INSERT INTO medicamento (codigo_producto, id_laboratorio, accion_terapeutica)
SELECT t.codigo, pg_temp.entre(1, c.laboratorios), m.descripcion
FROM tmp_producto t
CROSS JOIN cfg c
JOIN tmp_monodroga m ON m.grupo = t.cat AND m.slot = t.slot
WHERE t.cat <= 6;

-- Composición: la monodroga principal y, en analgésicos y antigripales, a veces una segunda (combinados)
INSERT INTO composicion (codigo_producto, id_monodroga, concentracion)
SELECT t.codigo, (m.grupo - 1) * 8 + m.slot, m.dosis
FROM tmp_producto t JOIN tmp_monodroga m ON m.grupo = t.cat AND m.slot = t.slot
WHERE t.cat <= 6
UNION ALL
SELECT t.codigo, (m2.grupo - 1) * 8 + m2.slot, m2.dosis
FROM tmp_producto t
CROSS JOIN LATERAL (SELECT 1 + (t.slot - 1 + pg_temp.entre(1, 7)) % 8 AS slot2) s
JOIN tmp_monodroga m2 ON m2.grupo = t.cat AND m2.slot = s.slot2
WHERE t.cat IN (1, 3) AND random() < 0.5;

-- Cada producto lo ofrecen entre 1 y 3 proveedores
INSERT INTO producto_proveedor (codigo_producto, id_proveedor, precio_acordado)
SELECT p.codigo_producto,
       1 + (p.codigo_producto * 7 + s.k * 11) % c.proveedores,
       round(p.precio_compra * (0.88 + random() * 0.17)::numeric, 2)
FROM producto p
CROSS JOIN cfg c
CROSS JOIN LATERAL generate_series(0, pg_temp.entre(0, 2) + 0 * p.codigo_producto) AS s(k)
ON CONFLICT DO NOTHING;

INSERT INTO lote (id_lote, codigo_producto, codigo_alfanumerico, fecha_fabricacion, fecha_vencimiento)
SELECT (p.codigo_producto - 1) * c.lotes_por_producto + s.k,
       p.codigo_producto,
       'L' || to_char(f.fab, 'YYMM') || '-' || upper(substr(md5(p.codigo_producto || '-' || s.k), 1, 5)),
       f.fab,
       f.fab + pg_temp.entre(540, 1080)
FROM producto p
CROSS JOIN cfg c
CROSS JOIN generate_series(1, c.lotes_por_producto) AS s(k)
CROSS JOIN LATERAL (SELECT date '2024-06-01' + pg_temp.entre(0, 480) + 0 * s.k AS fab) f;

-- Vencimiento del medicamento = el lote que vence primero
UPDATE medicamento m SET fecha_vencimiento = l.vence
FROM (SELECT codigo_producto, min(fecha_vencimiento) AS vence FROM lote GROUP BY codigo_producto) l
WHERE l.codigo_producto = m.codigo_producto;

-- Stock: todas las sucursales x todos los productos, apuntando a uno de los lotes del producto
INSERT INTO stock (id_farmacia, codigo_producto, id_lote, cantidad)
SELECT f.id_farmacia, p.codigo_producto,
       l.id_lote,
       CASE WHEN l.fecha_vencimiento <= date '2026-10-14' THEN 0
            WHEN p.id_categoria = 2 THEN pg_temp.entre(4, 45)
            WHEN p.id_categoria IN (1,3,4,5,6) THEN pg_temp.entre(8, 110)
            ELSE pg_temp.entre(3, 75) END
FROM farmacia f CROSS JOIN producto p CROSS JOIN cfg c
JOIN LATERAL (
  SELECT l.id_lote, l.fecha_vencimiento
  FROM lote l WHERE l.codigo_producto = p.codigo_producto
  ORDER BY (l.fecha_vencimiento <= date '2026-10-14'), random()
  LIMIT 1
) l ON true;

INSERT INTO descuento (id_descuento, codigo_producto, descripcion, porcentaje, fecha_inicio, fecha_fin)
SELECT g, pg_temp.entre(1, c.productos),
       pg_temp.elegir(ARRAY['Promoción del mes','Liquidación por vencimiento próximo','Descuento adulto mayor',
                            'Campaña de invierno','Oferta de temporada','Aniversario de la cadena']),
       (ARRAY[5, 10, 15, 20, 25, 30])[pg_temp.entre(1, 6)],
       d.ini, d.ini + pg_temp.entre(15, 45)
FROM cfg c
CROSS JOIN generate_series(1, c.descuentos) AS g
CROSS JOIN LATERAL (SELECT date '2025-10-01' + pg_temp.entre(0, 340) + 0 * g AS ini) d;


-- ---------------------------------------------------------------------
-- 7. CLIENTES Y VENTAS
-- ---------------------------------------------------------------------
INSERT INTO cliente (id_cliente, nombres, apellidos, telefono, direccion, correo)
SELECT s.g, s.nom, s.ap1 || ' ' || pg_temp.apellido(), pg_temp.celular(), pg_temp.direccion(),
       lower(pg_temp.sin_tildes(split_part(s.nom, ' ', 1) || '.' || s.ap1)) || s.g || '@'
         || pg_temp.elegir(ARRAY['gmail.com','gmail.com','hotmail.com','outlook.com','yahoo.com'])
FROM (
  SELECT g,
         pg_temp.nombre(x.mujer) || CASE WHEN random() < 0.3 THEN ' ' || pg_temp.segundo_nombre(x.mujer) ELSE '' END AS nom,
         pg_temp.apellido() AS ap1
  FROM cfg c CROSS JOIN generate_series(1, c.clientes) AS g
  CROSS JOIN LATERAL (SELECT random() < 0.5 AS mujer, g AS _g) x
) s;

-- Ventas de oct-2025 a sep-2026, de 07:00 a 22:59. La farmacia sale del empleado (venta → empleado → farmacia).
-- El 20 % de las ventas son a consumidor final sin cliente registrado.
INSERT INTO venta (id_venta, id_empleado, id_cliente, fecha_hora, total_cobrado)
SELECT g,
       e.ids[1 + floor(random() * cardinality(e.ids))::int],
       CASE WHEN random() < 0.8 THEN pg_temp.entre(1, c.clientes) END,
       timestamp '2025-10-01 00:00' + make_interval(days  => pg_temp.entre(0, 364),
                                                    hours => pg_temp.entre(7, 22),
                                                    mins  => pg_temp.entre(0, 59),
                                                    secs  => pg_temp.entre(0, 59)),
       0
FROM cfg c
CROSS JOIN (SELECT array_agg(id_empleado ORDER BY id_empleado) AS ids
            FROM empleado WHERE id_cargo IN (1, 2, 3, 4)) e
CROSS JOIN generate_series(1, c.ventas) AS g;

-- 1 a 4 productos distintos por venta; el precio histórico aplica el mayor descuento vigente ese día
INSERT INTO detalle_venta (id_detalle, id_venta, codigo_producto, cantidad, precio_historico)
SELECT row_number() OVER (ORDER BY i.id_venta, i.k),
       i.id_venta, i.prod, i.cant,
       round(p.precio_venta * (1 - coalesce(d.pct, 0) / 100.0), 2)
FROM (
  SELECT v.id_venta, v.fecha_hora, s.k,
         1 + (r.base + (s.k - 1) * 37) % c.productos AS prod,
         (ARRAY[1, 1, 1, 2, 2, 3])[pg_temp.entre(1, 6)] AS cant
  FROM venta v
  CROSS JOIN cfg c
  CROSS JOIN LATERAL (SELECT pg_temp.entre(1, 4) + 0 * v.id_venta AS n,
                             pg_temp.entre(0, c.productos - 1) + 0 * v.id_venta AS base) r
  CROSS JOIN LATERAL generate_series(1, r.n) AS s(k)
) i
JOIN producto p ON p.codigo_producto = i.prod
LEFT JOIN LATERAL (
  SELECT max(de.porcentaje) AS pct FROM descuento de
  WHERE de.codigo_producto = i.prod AND i.fecha_hora::date BETWEEN de.fecha_inicio AND de.fecha_fin
) d ON true;

UPDATE venta v SET total_cobrado = t.total
FROM (SELECT id_venta, sum(cantidad * precio_historico) AS total FROM detalle_venta GROUP BY id_venta) t
WHERE t.id_venta = v.id_venta;

-- COMPROBANTES DE PRUEBA, NO FACTURAS LEGALES SIAT: para el 85 % de ventas.
-- Si el cliente no dio NIT: el valor convencional '0' y la razón social S/N.
-- Los NIT simulados de los demás clientes no están validados ni pertenecen a esas personas.
INSERT INTO factura (id_factura, id_venta, nro_factura, nro_actualizacion, nit_cliente, razon_social,
                     fecha_emision, codigo_control)
SELECT row_number() OVER (ORDER BY v.fecha_hora, v.id_venta),
       v.id_venta,
       row_number() OVER (ORDER BY v.fecha_hora, v.id_venta),
       '29' || pg_temp.entre(1000000, 9999999)::text || pg_temp.entre(100000, 999999)::text,
       CASE WHEN cl.id_cliente IS NULL THEN '0' ELSE (1000000 + (cl.id_cliente::bigint * 104729) % 8999999)::text END,
       CASE WHEN cl.id_cliente IS NULL THEN 'S/N' ELSE upper(cl.apellidos) END,
       v.fecha_hora,
       upper(concat_ws('-', substr(h.md, 1, 2), substr(h.md, 3, 2), substr(h.md, 5, 2), substr(h.md, 7, 2), substr(h.md, 9, 2)))
FROM venta v
LEFT JOIN cliente cl ON cl.id_cliente = v.id_cliente
CROSS JOIN LATERAL (SELECT md5('factura-' || v.id_venta) AS md) h
WHERE random() < 0.85;

-- Receta médica para toda venta que incluya un antibiótico (categoría 2)
INSERT INTO receta_medica (id_receta, id_venta, nombre_medico, matricula_medica, fecha_emision_receta, institucion_salud)
SELECT row_number() OVER (ORDER BY v.id_venta),
       v.id_venta,
       CASE WHEN random() < 0.5 THEN 'Dra. ' || pg_temp.nombre(true) ELSE 'Dr. ' || pg_temp.nombre(false) END
         || ' ' || pg_temp.apellido(),
       'MP-' || pg_temp.entre(1000, 99999),
       v.fecha_hora::date - pg_temp.entre(0, 10),
       pg_temp.elegir(ARRAY['Hospital Viedma','Caja Nacional de Salud','Hospital del Niño',
                            'Hospital Obrero','Clínica Los Olivos','Centro de Salud Municipal',
                            'Consultorio particular','Seguro Universitario'])
FROM venta v
WHERE EXISTS (SELECT 1 FROM detalle_venta d JOIN producto p ON p.codigo_producto = d.codigo_producto
              WHERE d.id_venta = v.id_venta AND p.id_categoria = 2);


-- ---------------------------------------------------------------------
-- 8. AUDITORÍA
-- ---------------------------------------------------------------------
INSERT INTO auditoria (id_auditoria, id_usuario, fecha_hora, accion, entidad_afectada, id_registro_afectado, detalle)
SELECT a.g, a.usr, a.fh, a.acc, a.ent, a.reg,
       CASE WHEN a.acc IN ('LOGIN', 'LOGOUT') THEN initcap(a.acc) || ' del usuario ' || a.usr
            ELSE a.acc || ' en ' || a.ent || ' (registro ' || a.reg || ')' END
FROM (
  SELECT x.g, x.usr, x.fh, x.acc,
         CASE WHEN x.acc IN ('LOGIN', 'LOGOUT') THEN 'usuario' ELSE x.ent END AS ent,
         CASE WHEN x.acc IN ('LOGIN', 'LOGOUT') THEN x.usr::text ELSE pg_temp.entre(1, 30000)::text END AS reg
  FROM (
    SELECT g,
           pg_temp.entre(1, (SELECT count(*)::int FROM usuario)) AS usr,
           timestamp '2025-10-01 00:00' + make_interval(days => pg_temp.entre(0, 364), hours => pg_temp.entre(6, 23),
                                                        mins => pg_temp.entre(0, 59)) AS fh,
           pg_temp.elegir(ARRAY['LOGIN','LOGIN','LOGOUT','INSERT','INSERT','INSERT','UPDATE','UPDATE','DELETE']) AS acc,
           pg_temp.elegir(ARRAY['venta','detalle_venta','factura','stock','lote','producto','cliente',
                                'receta_medica','descuento']) AS ent
    FROM cfg c CROSS JOIN generate_series(1, c.auditorias) AS g
  ) x
) a;


-- ---------------------------------------------------------------------
-- 9. RESUMEN (una sola pestaña de resultados)
-- ---------------------------------------------------------------------
COMMIT;

SELECT tabla, filas FROM (
            SELECT 1 AS o, 'ciudad' AS tabla, count(*) AS filas FROM ciudad
  UNION ALL SELECT 2, 'farmacia', count(*) FROM farmacia
  UNION ALL SELECT 3, 'cargo', count(*) FROM cargo
  UNION ALL SELECT 4, 'empleado', count(*) FROM empleado
  UNION ALL SELECT 5, 'rol', count(*) FROM rol
  UNION ALL SELECT 6, 'usuario', count(*) FROM usuario
  UNION ALL SELECT 7, 'turno', count(*) FROM turno
  UNION ALL SELECT 8, 'asignacion_turno', count(*) FROM asignacion_turno
  UNION ALL SELECT 9, 'asignacion_farmaceutico', count(*) FROM asignacion_farmaceutico
  UNION ALL SELECT 10, 'salario', count(*) FROM salario
  UNION ALL SELECT 11, 'categoria', count(*) FROM categoria
  UNION ALL SELECT 12, 'laboratorio', count(*) FROM laboratorio
  UNION ALL SELECT 13, 'proveedor', count(*) FROM proveedor
  UNION ALL SELECT 14, 'producto', count(*) FROM producto
  UNION ALL SELECT 15, 'producto_proveedor', count(*) FROM producto_proveedor
  UNION ALL SELECT 16, 'medicamento', count(*) FROM medicamento
  UNION ALL SELECT 17, 'monodroga', count(*) FROM monodroga
  UNION ALL SELECT 18, 'composicion', count(*) FROM composicion
  UNION ALL SELECT 19, 'lote', count(*) FROM lote
  UNION ALL SELECT 20, 'stock', count(*) FROM stock
  UNION ALL SELECT 21, 'descuento', count(*) FROM descuento
  UNION ALL SELECT 22, 'cliente', count(*) FROM cliente
  UNION ALL SELECT 23, 'venta', count(*) FROM venta
  UNION ALL SELECT 24, 'detalle_venta', count(*) FROM detalle_venta
  UNION ALL SELECT 25, 'factura', count(*) FROM factura
  UNION ALL SELECT 26, 'receta_medica', count(*) FROM receta_medica
  UNION ALL SELECT 27, 'auditoria', count(*) FROM auditoria
) r ORDER BY o;
