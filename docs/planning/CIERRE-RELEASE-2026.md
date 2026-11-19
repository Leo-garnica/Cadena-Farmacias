# VitaFarma · Entrega de noviembre de 2026

El propietario aceptó los tres incrementos el **18 de noviembre de 2026**. El candidato funcional corresponde a `637015c`. La fecha objetivo original para cerrar G3 era el 27/11. Los tableros conservan las estimaciones para un desarrollador a 6 h al día. El esfuerzo humano efectivo y el consumo de reserva carecen de registro horario.

| Hito | Entrega aceptada | Evidencia |
|---|---|---|
| G1 | Portada pública Mostrador VitaFarma, acceso al equipo y base de práctica reproducible | [Sprint 1](SPRINT-1.md) · [portada](evidencias/portada-1280.png) |
| G2 | Inventario de PostgreSQL por sucursal asignada, búsqueda, paginación y detalle de lote | [Sprint 2](SPRINT-2.md) · [Centro](evidencias/inventario-centro.png) · [detalle](evidencias/inventario-lote.png) |
| G3 | Dashboard con tres consultas verificables, ocho recursos de gestión y registro y consulta de ventas en la copia local | [Sprint 3](SPRINT-3.md) · [indicadores](evidencias/dashboard-1280.png) · [gestión](evidencias/gestion.png) · [venta](evidencias/venta.png) |

El propietario retiró el directorio de proveedores y el historial comercial general para dar prioridad al dashboard y al Trabajo 4. El historial de práctica permite consultar la venta recién registrada. La facturación, la anulación de ventas y la operación comercial en producción quedan para un alcance posterior. La investigación bibliográfica y la defensa de la asignatura tienen su propio calendario. [Parte II del Trabajo 4, con capturas del navegador y de las tablas](../trabajo-4/README.md)

## Qué se verificó

Las pruebas de navegador con respuestas controladas cubren fallos y casos límite. Por separado, Chromium inició sesión contra Supabase Auth local y abrió la aplicación normal, que consulta NestJS y PostgreSQL. El dataset fijo `VF-PRACTICA-1` permite repetir los conteos. Las operaciones del Trabajo 4 usan otra base local, `vitafarma_gestion`, con datos sintéticos persistentes.

| Casos | Comprobación | Resultado observado |
|---|---|---|
| QA-01 | Portada pública, teclado, foco y movimiento reducido | Abre sin configuración de Auth. Se verificaron 360, 768 y 1280 px. |
| QA-02, QA-03 | Firma, caducidad, emisor, audiencia, sesión ausente y cuenta sin asignación | API rechaza los tokens inválidos con 401 y la cuenta sin sucursales con 403. Tras cerrar sesión desaparece el inventario anterior. |
| QA-04 | Listado, indicadores, metadatos y detalle por sucursal | El operador solo ve Centro. Una consulta no autorizada se deniega. El detalle ajeno e inexistente devuelve la misma respuesta 404. |
| QA-05, QA-06 | Ordenación, filtros, dos páginas y casos de datos ausentes | 12 productos en el dataset de control. Se distinguieron cantidad cero, cantidad desconocida, falta de fila y falta de lote. |
| QA-07, QA-08 | Enlaces directos, recarga, expiración, consulta inválida y servicio indisponible | El recorrido de autenticación y los estados de error/recuperación pasaron. Una caída de la API muestra un error de consulta. |
| QA-09, QA-10 | Comparación del agregado y del listado filtrado con SQL, y fecha civil | En Centro hubo 10 registros, 2 con cantidad cero y 1 con lote vencido. Los tres enlaces abrieron las filas correspondientes. Se verificaron fechas en La Paz y Kiritimati. |
| QA-11 | Dependencias de producción, configuración, archivos versionados y build web | La auditoría de npm devolvió 0 avisos conocidos. La comparación con las credenciales privadas generadas encontró 0 coincidencias en las fuentes revisadas y la compilación web. |
| QA-12 | Privilegios y escritura | La cuenta lectora tiene permisos limitados. Las operaciones de gestión requieren el perfil responsable, asignación y conexión de escritura a la base local marcada. Pasaron las comprobaciones de permisos, relaciones, conflicto concurrente, reintento y reversión. |
| QA-13 | Instalación y recuperación local | Se instaló con el lockfile raíz. Se arrancaron los modos de lectura y gestión. Tras reiniciar Docker se recuperaron base, cuentas y registros conservados. |
| QA-14 | Ampliaciones P1 | Retiradas por el propietario. Los escenarios de aceptación de esos módulos quedaron fuera de esta entrega. |
| QA-15 | Archivos y operaciones académicas | La comparación con la base `2a39370` mantuvo los scripts originales y la instantánea académica. La evidencia de escrituras procede exclusivamente del entorno de gestión local. |

**Pruebas de gestión.** PostgreSQL verificó altas, consultas, cambios y bajas de los ocho recursos. El servicio protege las relaciones y restringe los clientes, planillas y usuarios según su alcance. La venta valida unidades, precio y lote y guarda cabecera, detalles y descuento de stock en una transacción. Al reintentar la misma orden se recupera la venta existente. En la demostración, la venta **100060** de Bs 6,00 redujo el saldo de Norte de 23 a 22. La planilla **100015** pasó de Bs 540 a Bs 555 al ajustar sus bonos. [Informe PDF con las filas de PostgreSQL](../trabajo-4/VitaFarma-interfaces.pdf)

**Rendimiento.** En Windows x64, Intel Core i7-12650H y Node 22.23.3, se midieron 50 peticiones por ruta tras calentamiento, con concurrencia 5 y 12 productos de control. El p95 fue **302,0 ms** para el listado y **80,1 ms** para los indicadores. La meta local era 1.000 ms. El volumen y la latencia de la base académica siguen sin medirse.

## Cómo repetir la verificación

Desde la raíz, con Node 22.12 o superior, npm y Docker Desktop con contenedores Linux:

1. Ejecutar `npm ci`. Instalar Chromium de Playwright según la [guía de desarrollo](../architecture/DEVELOPMENT.md) si es la primera instalación. Ejecutar `npm run check`. En el candidato pasaron tipos, lint, compilación, 3 pruebas de arquitectura, 7 del backend y 51 de navegador.
2. Ejecutar `npm run dev:practica`. En otra terminal, ejecutar `node backend/integration/inventory-practica.mjs --rendimiento` y `npm run test:auth:practica --workspace @vitafarma/frontend`. El segundo comando utiliza el modo de lectura con datos de control.
3. Detener la aplicación con Ctrl+C y ejecutar `npm run dev:gestion`. En otra terminal PowerShell, la siguiente prueba ejecuta dos casos contra la práctica y revierte las filas del ensayo:

   ```powershell
   node --env-file="$env:USERPROFILE/.vitafarma/practica-v1/backend.gestion.env.local" --test backend/test/practica.integration.mjs
   ```

4. Para revisar dependencias de producción, ejecutar `npm audit --omit=dev`. Los resultados dependen del registro disponible en la fecha de la consulta.

## Guion de revisión y defensa · 10–15 minutos

1. Abrir la portada y entrar como operador de práctica. Seleccionar Centro, abrir una ficha y revisar cantidad y lote. Las contraseñas generadas están en la carpeta privada indicada en la [guía de acceso](../SUPABASE-LOGIN.md).
2. En Indicadores, abrir «Sin unidades», comprobar el filtro y regresar con Atrás. Probar la cuenta sin sucursales para observar la denegación.
3. En modo gestión, ingresar como supervisor. Localizar la farmacia, el producto y el empleado de ejemplo. Abrir la planilla y comparar sus valores con el informe.
4. En Ventas, abrir la venta 100060 en la máquina de la demostración. En una instalación nueva se puede registrar una venta de práctica y consultar su propio identificador. Contrastar cabecera, detalle y stock con las [consultas de lectura](../trabajo-4/consultas.sql).

## Entrega, recuperación y trabajo pendiente

GitHub recibe el código, el plan y las evidencias en `main` mediante integración desde `develop`. Para recuperar la aplicación, detener web y API, utilizar una copia de la revisión funcional elegida, instalar su lockfile y arrancar el modo local apropiado. Los volúmenes de práctica se conservan con `node local/practica.mjs stop`. La reversión del código no necesita ejecutar scripts contra la BD académica.

La conexión académica queda preparada para lectura en el servidor. Su comprobación SQL requiere una credencial lectora dedicada y asignaciones confirmadas. La publicación del código en GitHub y el arranque local cubren la entrega solicitada. El despliegue de un servicio público sigue pendiente de un destino y autorización.
