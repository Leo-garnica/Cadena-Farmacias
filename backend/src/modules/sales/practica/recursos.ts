export interface Campo {
  clave: string
  etiqueta: string
  tipo: 'texto' | 'entero' | 'importe' | 'fecha' | 'opcion'
  requerido: boolean
  referencia?: string
  opciones?: string[]
  soloAlta?: boolean
  max?: number
}
type Ambito = 'farmacia' | 'empleado' | 'global'
export interface Recurso {
  clave: string; titulo: string; id: string; tabla: string; ambito: Ambito; campos: Campo[]; columnas: string[]
}
const texto = (clave: string, etiqueta: string, max: number, requerido = false): Campo => ({ clave, etiqueta, tipo: 'texto', requerido, max })
const opcion = (clave: string, etiqueta: string, referencia: string): Campo => ({ clave, etiqueta, tipo: 'opcion', requerido: true, referencia })
const fecha = (clave: string, etiqueta: string, requerido = false): Campo => ({ clave, etiqueta, tipo: 'fecha', requerido })
const importe = (clave: string, etiqueta: string): Campo => ({ clave, etiqueta, tipo: 'importe', requerido: true })
function recurso(clave: string, titulo: string, tabla: string, id: string, ambito: Ambito, campos: Campo[], calculados: string[] = []): Recurso {
  return { clave, titulo, tabla, id, ambito, campos, columnas: [...new Set([id, ...campos.map(campo => campo.clave), ...calculados])] }
}
export const recursos = [
  recurso('farmacias', 'Sucursales', 'farmacia', 'id_farmacia', 'farmacia', [
    { clave: 'id_farmacia', etiqueta: 'ID de sucursal autorizada', tipo: 'entero', requerido: true, soloAlta: true },
    texto('nombre','Nombre',100,true), opcion('id_ciudad','Ciudad','ciudades'), texto('direccion','Dirección',200), texto('telefono','Teléfono',20),
  ]),
  recurso('empleados', 'Empleados', 'empleado', 'id_empleado', 'farmacia', [
    texto('nombre_completo','Nombre completo',150,true), opcion('id_cargo','Cargo','cargos'), opcion('id_farmacia','Sucursal','farmacias'),
    texto('direccion','Dirección',200), fecha('fecha_nacimiento','Fecha de nacimiento'), fecha('fecha_ingreso','Fecha de ingreso'),
    texto('telefono','Teléfono',20), texto('titulo_profesional','Título profesional',100),
  ]),
  recurso('productos', 'Productos', 'producto', 'codigo_producto', 'global', [
    texto('nombre','Nombre',100,true), opcion('id_categoria','Categoría','categorias'), texto('descripcion','Descripción',200),
    texto('presentacion','Presentación',100), importe('precio_compra','Precio de compra'), importe('precio_venta','Precio de venta'),
  ]),
  recurso('medicamentos', 'Medicamentos', 'medicamento', 'codigo_producto', 'global', [
    { ...opcion('codigo_producto','Producto','productos'), soloAlta: true }, opcion('id_laboratorio','Laboratorio','laboratorios'),
    fecha('fecha_vencimiento','Vencimiento'), texto('accion_terapeutica','Acción terapéutica',100),
  ]),
  recurso('clientes', 'Clientes', 'cliente', 'id_cliente', 'global', [
    texto('nombres','Nombres',100,true), texto('apellidos','Apellidos',100,true), texto('telefono','Teléfono',20), texto('direccion','Dirección',200), texto('correo','Correo',150),
  ]),
  recurso('descuentos', 'Descuentos', 'descuento', 'id_descuento', 'global', [
    opcion('codigo_producto','Producto','productos'), texto('descripcion','Descripción',200,true),
    { ...importe('porcentaje','Porcentaje'), max: 100 }, fecha('fecha_inicio','Desde',true), fecha('fecha_fin','Hasta',true),
  ]),
  recurso('planillas', 'Planillas salariales', 'salario', 'id_salario', 'empleado', [
    opcion('id_empleado','Empleado','empleados'), importe('sueldo_base','Sueldo base'), importe('monto_antiguedad','Antigüedad'),
    importe('bonos','Bonos'), importe('descuentos','Descuentos'), fecha('fecha_elaboracion','Fecha de elaboración',true), fecha('fecha_cobro','Fecha de cobro'),
  ], ['total_cobrar']),
  recurso('usuarios', 'Usuarios del sistema', 'usuario', 'id_usuario', 'empleado', [
    texto('nombre_usuario','Nombre de usuario',50,true), opcion('id_empleado','Empleado','empleados'), opcion('id_rol','Rol académico','roles'),
    { clave:'estado',etiqueta:'Estado',tipo:'opcion',requerido:true,opciones:['ACTIVO','INACTIVO'] },
  ]),
]

export const referencias = new Map(Object.entries({
  ciudades: { tabla:'ciudad', id:'id_ciudad', nombre:'nombre' }, cargos:{tabla:'cargo',id:'id_cargo',nombre:'nombre'},
  farmacias: {tabla:'farmacia',id:'id_farmacia',nombre:'nombre'}, categorias:{tabla:'categoria',id:'id_categoria',nombre:'nombre'},
  laboratorios:{tabla:'laboratorio',id:'id_laboratorio',nombre:'nombre'}, productos:{tabla:'producto',id:'codigo_producto',nombre:'nombre'},
  empleados:{tabla:'empleado',id:'id_empleado',nombre:'nombre_completo'}, roles:{tabla:'rol',id:'id_rol',nombre:'nombre_rol'},
  clientes:{tabla:'cliente',id:'id_cliente',nombre:"concat_ws(' ',nombres,apellidos)"},
}))
