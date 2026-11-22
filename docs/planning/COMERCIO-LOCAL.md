# Probar la tienda, la caja y la gestión de VitaFarma

## Arranque

Con Node.js 22.12 o posterior y Docker Desktop abierto, ejecuta desde la raíz:

```cmd
npm ci
npm run dev:comercio
```

Abre [VitaFarma en tu equipo](http://127.0.0.1:5173/). La tienda opera con Supabase Auth local, NestJS y la base PostgreSQL `vitafarma_comercio`. El modo usa los mismos puertos de desarrollo que la entrega del Trabajo 4. Detén los procesos con **Ctrl+C** antes de cambiar de modo. La base `vitafarma_gestion` del Trabajo 4 se abre con `npm run dev:gestion`.

Las cuentas se aprovisionan al iniciar el modo de comercio. En otra terminal de CMD puedes abrir el archivo privado:

```cmd
notepad "%USERPROFILE%\.vitafarma\practica-v1\cuentas.comercio.json"
```

| Cuenta de práctica | Qué permite comprobar |
|---|---|
| `cliente@vitafarma.test` | Comprar, pagar de manera simulada, seguir y consultar pedidos propios. |
| `solicitante@vitafarma.test` | Solicitar acceso al personal y esperar la resolución. |
| `caja.centro@vitafarma.test` | Caja presencial y preparación de pedidos de Centro. |
| `jefe.centro@vitafarma.test` | Accesos de empleados y operación en Centro. |
| `supervisor@vitafarma.test` | Supervisión de Centro y Sur en Cochabamba. |
| `supervisor.sucre@vitafarma.test` | Supervisión de Chuquisaca para comprobar el alcance departamental. |
| `jefe.norte@vitafarma.test`, `caja.norte@vitafarma.test` | Operación en Norte para comparar sucursales y permisos. |
| `jefe.sur@vitafarma.test`, `caja.sur@vitafarma.test` | Operación en Sur para comparar su venta con Centro bajo el mismo supervisor. |

Usa perfiles de navegador separados para abrir varias cuentas a la vez. Diferentes pestañas de un mismo perfil comparten la sesión.

## Recorrido de demostración

1. Desde la portada abre **Explorar la tienda** y elige Centro. Agrega un producto disponible, entra como cliente y elige **Retiro en farmacia**. Revisa el total y pulsa **Pagar**. La operación simula el cobro y reserva unidades sin pedir datos bancarios.
2. En el perfil de caja de Centro abre **Pedidos**, toma la orden y marca la preparación. En el perfil del cliente revisa el aviso, el código de retiro y el plazo. En caja, usa el código para completar la entrega y revisar la venta y el comprobante interno.
3. En caja registra una venta presencial. Abre después el historial con el supervisor. Usa el filtro de fecha y canal y contrasta el total por sucursal.
4. Como solicitante, envía una solicitud de empleado para Centro. Apruébala con la jefatura de Centro. Una solicitud para la jefatura se resuelve con el supervisor del departamento de la sucursal.
5. Prueba **Envío** en una zona de demostración. Revisa que la tarifa se sume antes de pagar. En la sucursal, prepara y despacha. La venta y el stock se actualizan al despachar, y el pedido pasa a entregado cuando se registra la recepción.

## Decisiones operativas

- El pago de prueba se confirma con una acción y queda identificado como simulado. El importe lo calcula la API con precios, cantidades y tarifa de la sucursal. El comprobante tiene propósito interno y académico.
- La disponibilidad corresponde al stock físico menos las reservas activas. La sucursal conserva un máximo de 24 h para preparar un pedido pendiente. Una vez listo, el cliente tiene 72 h para retirar. Una cancelación o vencimiento previos a la salida libera las unidades. [Retiro en farmacia de Cruz Verde](https://beta.cruzverde.cl/servicio-al-cliente/retiro-en-farmacia.html)
- La entrega tiene zonas de simulación. La tarifa figura por separado y el cliente indica la dirección. El plazo estimado del piloto y su tarifa se muestran como valores de práctica. [Política de envío de Farmacorp](https://farmacorp.com/policies/shipping-policy)
- Solo una persona puede tomar un pedido. El orden de llegada y la visibilidad de la cola corresponden a la sucursal. La jefatura y la supervisión pueden resolver una reasignación dentro de su ámbito.
- Las ventas conservan la sucursal original y el canal. El ranking usa ventas registradas y suma sus importes y unidades. Las operaciones y los datos de ejemplo se guardan en la copia local de comercio.
- El historial permite filtrar por sucursal, periodo, canal y estado de la venta. Las devoluciones conservan el registro original, restituyen las unidades del lote si corresponde y se excluyen del total vigente.

## Repetir las comprobaciones

Con el modo comercio activo, abre otra terminal en la raíz y ejecuta:

```cmd
node --test backend/integration/commerce-local.mjs
node frontend/integration/comercio-local.mjs
```

La segunda prueba requiere Chromium de Playwright. Ambas usan cuentas y operaciones ficticias en la copia de comercio. La prueba de navegador guarda capturas en `frontend/test-results/comercio-local`. [Preparar Chromium](../architecture/DEVELOPMENT.md)

[Modelo aprobado y plan de ampliación](VITAFARMA-MODELO-DE-NEGOCIO-Y-PLAN-OMNICANAL.md) · [Entorno local del Trabajo 4](../architecture/ENTORNO-LOCAL.md)
