# VitaFarma · Interfaz del equipo

## Entrar

Con Node.js 22.12 o superior y Docker local, abre una terminal en la raíz del repositorio. Ejecuta `npm ci` y uno de estos comandos.

| Comando | Recorrido |
| --- | --- |
| `npm run dev:practica` | Portada, acceso, inventario e indicadores sobre el dataset de referencia. |
| `npm run dev:gestion` | Añade los formularios académicos y las ventas. El inventario muestra el stock de esta copia de gestión. |

Abre la portada y selecciona el acceso del personal. En las cuentas de práctica, el operador consulta Centro y el supervisor puede cambiar de sucursal. En modo gestión el supervisor también ve **Gestión** y **Ventas**. Las contraseñas de estas identidades ficticias se generan en la carpeta personal del equipo. [Portada local](http://127.0.0.1:5173/) · [Acceso y perfiles](../docs/SUPABASE-LOGIN.md)

## Recorrer las pantallas

| Ruta | Qué comprobar |
| --- | --- |
| `/` | La portada Mostrador VitaFarma se abre sin sesión. |
| `/equipo/entrar` | El formulario acepta correo y contraseña de Supabase Auth. Al entrar se recupera la ruta interna solicitada. |
| `/inventario?farmacia=1` | El dataset de control presenta 12 productos, 10 registros y 2 saldos en cero. Una consulta vacía ofrece limpiar filtros. |
| `/inventario/1/101?tab=lote` | El detalle de Paracetamol muestra su saldo en Centro y el lote asociado. Escape cierra el panel. |
| `/indicadores?farmacia=1` | Cada cifra enlaza con los registros correspondientes. La búsqueda y la categoría se conservan al abrir el inventario. |
| `/practica/farmacias` | En gestión, el supervisor puede abrir los formularios de sucursales, empleados, productos, medicamentos, clientes, descuentos, planillas y usuarios. |
| `/practica/ventas` | El supervisor elige sucursal, empleado y cliente, añade productos, confirma la venta y consulta el detalle con el precio cobrado. |

En inventario se distinguen saldo cero, cantidad desconocida y producto sin fila de stock. El vencimiento se compara con la fecha civil del servidor en Bolivia. La consulta, la sucursal y la página se pueden compartir mediante la URL. La autorización se vuelve a comprobar en el servidor cuando otra cuenta abre el enlace. [Datos y casos de referencia](../docs/architecture/ENTORNO-LOCAL.md)

## Desarrollo y comprobación

El frontend usa React, TypeScript, React Router y Vite. La portada y el acceso son módulos independientes. El inventario consume la API NestJS mediante el adaptador HTTP compuesto en `src/app/repositories.ts`. Los formularios y la venta usan `/api/v1/practica`. El navegador recibe la URL de Auth y la clave pública. Las conexiones a PostgreSQL y el mapa de sucursales viven en el servidor.

Los filtros y el detalle de inventario conservan su estado en la URL. La interfaz utiliza Inter e Inter Tight locales, controles con foco visible y movimiento reducido. En pantallas estrechas el menú se abre desde la cabecera.

Desde la raíz, `npm run test:e2e` ejecuta Chromium en dos servidores aislados con servicios controlados. Con `npm run dev:practica` activo, `npm run test:auth:practica --workspace @vitafarma/frontend` recorre el acceso con Auth local e inventario desde PostgreSQL. Los reportes regenerables se guardan en `frontend/playwright-report/` y `frontend/test-results/`. [Instalación de Chromium y comandos](../docs/architecture/DEVELOPMENT.md)
