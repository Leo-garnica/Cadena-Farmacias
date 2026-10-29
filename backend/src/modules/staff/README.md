# Personal

Estado: límite registrado en el monolito, funcionalidad pendiente.

Tablas bajo responsabilidad lógica: cargo, empleado, turno, asignacion_turno, asignacion_farmaceutico, salario.

Personal, turnos, remuneraciones y asignaciones farmacéuticas por ciudad, no por sucursal.

Al desarrollar un caso aprobado, usar `domain/`, `application/`, `infrastructure/`
y `presentation/`, como en Inventario. No se crean servicios ni CRUD ficticios para
rellenar carpetas. Exponer integraciones en `public.ts`; no importar repositorios
ni clases internas de otro módulo. La propiedad lógica no altera esquemas o claves.

La reserva de este módulo no habilita escrituras, datos sensibles ni funciones de BD.
