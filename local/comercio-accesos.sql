DO $$ BEGIN
  IF current_database() <> 'vitafarma_comercio' THEN
    RAISE EXCEPTION 'Destino incorrecto para los accesos de comercio';
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS commerce;
REVOKE ALL ON SCHEMA commerce FROM PUBLIC;
GRANT USAGE ON SCHEMA commerce TO vf_gestion;

CREATE TABLE IF NOT EXISTS commerce.installation (version text PRIMARY KEY);

CREATE TABLE IF NOT EXISTS commerce.department (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS commerce.city_department (
  city integer PRIMARY KEY REFERENCES public.ciudad(id_ciudad),
  department text NOT NULL REFERENCES commerce.department(id)
);

CREATE TABLE IF NOT EXISTS commerce.identity (
  subject uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('cliente', 'personal', 'solicitante')),
  name text NOT NULL,
  email text NOT NULL,
  customer integer UNIQUE REFERENCES public.cliente(id_cliente),
  CHECK ((kind = 'cliente') = (customer IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS commerce.department_supervisor (
  department text PRIMARY KEY REFERENCES commerce.department(id),
  subject uuid NOT NULL UNIQUE REFERENCES commerce.identity(subject)
);

CREATE TABLE IF NOT EXISTS commerce.branch_staff (
  subject uuid NOT NULL REFERENCES commerce.identity(subject),
  branch integer NOT NULL REFERENCES public.farmacia(id_farmacia),
  employee integer NOT NULL UNIQUE REFERENCES public.empleado(id_empleado),
  role text NOT NULL CHECK (role IN ('jefe', 'empleado')),
  active boolean NOT NULL DEFAULT true,
  approved_by uuid NOT NULL REFERENCES commerce.identity(subject),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject, branch)
);

CREATE TABLE IF NOT EXISTS commerce.staff_request (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject uuid NOT NULL REFERENCES commerce.identity(subject),
  branch integer NOT NULL REFERENCES public.farmacia(id_farmacia),
  role text NOT NULL CHECK (role IN ('jefe', 'empleado')),
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES commerce.identity(subject)
);

CREATE UNIQUE INDEX IF NOT EXISTS staff_request_one_pending
  ON commerce.staff_request(subject, branch) WHERE status = 'pendiente';

CREATE TABLE IF NOT EXISTS commerce.staff_event (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor uuid NOT NULL REFERENCES commerce.identity(subject),
  target uuid NOT NULL REFERENCES commerce.identity(subject),
  branch integer NOT NULL REFERENCES public.farmacia(id_farmacia),
  action text NOT NULL CHECK (action IN ('aprobada', 'rechazada', 'desactivada')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON commerce.installation, commerce.department, commerce.department_supervisor, commerce.city_department TO vf_gestion;
GRANT SELECT, INSERT, UPDATE(kind, name, email, customer) ON commerce.identity TO vf_gestion;
GRANT SELECT, INSERT, UPDATE(role, active, approved_by, updated_at) ON commerce.branch_staff TO vf_gestion;
GRANT SELECT, INSERT, UPDATE(status, resolved_at, resolved_by) ON commerce.staff_request TO vf_gestion;
GRANT INSERT ON commerce.staff_event TO vf_gestion;
GRANT USAGE ON SEQUENCE commerce.staff_request_id_seq, commerce.staff_event_id_seq TO vf_gestion;

SELECT NOT EXISTS (
  SELECT FROM commerce.installation WHERE version = 'VF-COMERCIO-LOCAL-1'
) AS inicializar_accesos \gset
\if :inicializar_accesos
INSERT INTO commerce.department (id, name)
VALUES ('cochabamba', 'Cochabamba'), ('chuquisaca', 'Chuquisaca');

INSERT INTO commerce.city_department (city, department)
VALUES (1, 'cochabamba'), (2, 'chuquisaca');

INSERT INTO public.empleado (id_empleado, id_cargo, id_farmacia, nombre_completo) VALUES
  (30004, 2, 1, 'Jefatura Centro'),
  (30005, 1, 1, 'Caja Centro'),
  (30009, 2, 2, 'Jefatura Norte'),
  (30010, 1, 2, 'Caja Norte');

INSERT INTO commerce.identity (subject, kind, name, email, customer) VALUES
  ('00000000-0000-4000-8000-000000000002', 'personal', 'Supervisión Cochabamba', 'supervisor@vitafarma.test', NULL),
  ('00000000-0000-4000-8000-000000000004', 'personal', 'Jefatura Centro', 'jefe.centro@vitafarma.test', NULL),
  ('00000000-0000-4000-8000-000000000005', 'personal', 'Caja Centro', 'caja.centro@vitafarma.test', NULL),
  ('00000000-0000-4000-8000-000000000006', 'cliente', 'Cliente de práctica', 'cliente@vitafarma.test', 1),
  ('00000000-0000-4000-8000-000000000008', 'personal', 'Supervisión Chuquisaca', 'supervisor.sucre@vitafarma.test', NULL),
  ('00000000-0000-4000-8000-000000000009', 'personal', 'Jefatura Norte', 'jefe.norte@vitafarma.test', NULL),
  ('00000000-0000-4000-8000-000000000010', 'personal', 'Caja Norte', 'caja.norte@vitafarma.test', NULL);

INSERT INTO commerce.department_supervisor (department, subject) VALUES
  ('cochabamba', '00000000-0000-4000-8000-000000000002'),
  ('chuquisaca', '00000000-0000-4000-8000-000000000008');

INSERT INTO commerce.branch_staff (subject, branch, employee, role, approved_by) VALUES
  ('00000000-0000-4000-8000-000000000004', 1, 30004, 'jefe', '00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000005', 1, 30005, 'empleado', '00000000-0000-4000-8000-000000000004'),
  ('00000000-0000-4000-8000-000000000009', 2, 30009, 'jefe', '00000000-0000-4000-8000-000000000008'),
  ('00000000-0000-4000-8000-000000000010', 2, 30010, 'empleado', '00000000-0000-4000-8000-000000000009');

INSERT INTO commerce.installation VALUES ('VF-COMERCIO-LOCAL-1');
\endif

-- Una segunda sucursal de Cochabamba permite probar el ranking departamental.
INSERT INTO public.farmacia (id_farmacia, id_ciudad, nombre, direccion)
VALUES (3, 1, 'Sucursal Sur', 'Dirección de práctica Sur')
ON CONFLICT (id_farmacia) DO NOTHING;

INSERT INTO public.empleado (id_empleado, id_cargo, id_farmacia, nombre_completo) VALUES
  (30011, 2, 3, 'Jefatura Sur'), (30012, 1, 3, 'Caja Sur')
ON CONFLICT (id_empleado) DO NOTHING;

INSERT INTO commerce.identity (subject, kind, name, email, customer) VALUES
  ('00000000-0000-4000-8000-000000000011', 'personal', 'Jefatura Sur', 'jefe.sur@vitafarma.test', NULL),
  ('00000000-0000-4000-8000-000000000012', 'personal', 'Caja Sur', 'caja.sur@vitafarma.test', NULL)
ON CONFLICT (subject) DO NOTHING;

INSERT INTO commerce.branch_staff (subject, branch, employee, role, approved_by) VALUES
  ('00000000-0000-4000-8000-000000000011', 3, 30011, 'jefe', '00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000012', 3, 30012, 'empleado', '00000000-0000-4000-8000-000000000011')
ON CONFLICT (subject, branch) DO NOTHING;

INSERT INTO public.stock (id_farmacia, codigo_producto, cantidad) VALUES
  (3, 104, 8), (3, 106, 3), (3, 107, 2), (3, 110, 5)
ON CONFLICT (id_farmacia, codigo_producto) DO NOTHING;
