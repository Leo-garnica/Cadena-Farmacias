# Inicio de sesión del personal

La portada es pública. El enlace del equipo abre `/equipo/entrar`. Supabase Auth emite la sesión y NestJS verifica su firma, emisor, audiencia, caducidad e identidad en cada solicitud protegida. Un mapa privado asigna el perfil y las sucursales a cada UUID. Una sesión válida sin asignación recibe acceso restringido.

## Entrar en la práctica

1. Desde la raíz instala las dependencias con `npm ci`. Ejecuta `npm run dev:practica` para inventario e indicadores o `npm run dev:gestion` para trabajar además con los formularios y ventas.
2. Abre [el acceso del equipo](http://127.0.0.1:5173/equipo/entrar). Las contraseñas ficticias se generan al preparar Auth y se guardan en `.vitafarma/practica-v1/cuentas.json` dentro de tu carpeta personal.
3. Entra con la identidad adecuada al recorrido. Cierra la sesión desde la cabecera antes de cambiar de cuenta.

| Cuenta | Acceso en la aplicación |
| --- | --- |
| `operador@vitafarma.test` | Inventario e indicadores de Centro (ID 1). |
| `supervisor@vitafarma.test` | Consulta de Centro y Norte (IDs 1 y 2). En gestión puede administrar los recursos de práctica y tiene preasignado el ID 3 para demostrar el alta de sucursal. |
| `sinacceso@vitafarma.test` | Auth acepta la identidad y NestJS deniega la consulta por falta de asignación. |

Los arranques de práctica cargan automáticamente archivos privados de servidor y variables públicas distintas para el navegador. Las fichas de `usuario` en el formulario académico y las identidades de Supabase Auth son independientes. [Entorno de práctica](architecture/ENTORNO-LOCAL.md) · [Permisos de gestión](../backend/src/modules/sales/README.md)

## Conexión prevista al proyecto académico

La validación remota queda pendiente de un rol lector dedicado y del mapa de sucursales autorizado por el propietario. Con ambos disponibles, configura el backend en una terminal privada. Conserva `VITAFARMA_PRACTICA_WRITE_URL` ausente.

| Componente | Configuración |
| --- | --- |
| Servidor | `DATABASE_URL` con TLS verificado y una cuenta con SELECT sobre `farmacia`, `ciudad`, `categoria`, `producto`, `stock`, `lote` y `medicamento`. El lector valida los permisos efectivos al consultar. |
| Servidor | `SUPABASE_URL` con el origen HTTPS del proyecto Auth. Su endpoint público de claves debe exponer la clave asimétrica usada por los tokens. |
| Servidor | `VITAFARMA_ACCESS_MAP` con un objeto JSON. Cada clave es el UUID de Auth y cada valor tiene `perfil` (`consulta` o `responsable`) y `sucursales` (IDs positivos autorizados). |
| Navegador | `VITE_SUPABASE_URL` con el mismo origen y `VITE_SUPABASE_PUBLISHABLE_KEY` con la clave pública del proyecto. [Ejemplo del frontend](../frontend/.env.example) |

Arranca NestJS con `npm run dev:backend` en la terminal que contiene las variables privadas y Vite con `npm run dev:frontend` en otra. Para Vite también puedes usar `frontend/.env.local`, excluido de Git. Comprueba primero `GET /api/v1/ready`, después el ingreso de prueba, `GET /api/v1/me` y el acceso a una sucursal permitida. Un rol más amplio que el admitido impide la lectura. [Contrato de la API](../backend/README.md)

## Verificar el acceso

Con Chromium instalado y `npm run dev:practica` activo, abre otra terminal en la raíz. El recorrido requiere libre el puerto 4173.

```sh
npm run test:auth:practica --workspace @vitafarma/frontend
```

El recorrido inicia sesión, consulta la sucursal autorizada, abre un lote, recarga la página, reabre en otra pestaña, cierra la sesión y comprueba la denegación de la cuenta sin asignación. Los casos con respuestas controladas de red, caducidad y configuración se ejecutan con `npm run test:e2e`. [Guía de desarrollo](architecture/DEVELOPMENT.md) · [Captura de acceso local](planning/evidencias/acceso-local-2026-11-18.png)
