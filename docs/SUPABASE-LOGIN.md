# Inicio de sesión del personal

La ruta del equipo es `/equipo/entrar`. El SDK de Supabase comprueba la identidad durante el acceso a las rutas protegidas. El acceso del navegador y el permiso para consultar una farmacia en NestJS se comprueban por separado.

## Configurar el navegador

1. Usar [el ejemplo del frontend](../frontend/.env.example) para crear `frontend/.env.local`.
2. Indicar en `VITE_SUPABASE_URL` la URL del proyecto Auth correspondiente. La URL de desarrollo en loopback admite HTTP. Un proyecto remoto requiere HTTPS.
3. Definir `VITE_SUPABASE_PUBLISHABLE_KEY` con la clave pública de ese mismo proyecto. El bundle incorpora las variables `VITE_*`. Una contraseña PostgreSQL o clave privada del servidor pertenece únicamente al backend.
4. Reiniciar Vite. Abrir la ruta de acceso e iniciar sesión con una cuenta de ese entorno. La configuración ausente produce un mensaje de configuración y mantiene bloqueado el acceso interno.

La sesión se verifica con el proveedor. El login admite volver a una ruta interna solicitada anteriormente y el cierre local invalida el acceso en el navegador. Para validar la integración usar una cuenta de práctica. Los dobles de Auth en Playwright cubren fallos de red, caducidad y navegación.

## Comprobar

Desde la raíz, instalar las versiones del lockfile con `npm ci`. Ejecutar `npm run test:e2e` para recorrer los casos de acceso en el navegador. Playwright inicia dos servidores en loopback, uno con la configuración de pruebas y otro sin configuración de Auth. Véanse [la guía de desarrollo](architecture/DEVELOPMENT.md) y [la trazabilidad de la integración](planning/INTEGRACION-Y-TRABAJO-4.md).

Para repetir el recorrido con **Supabase Auth real de práctica**, iniciar el [entorno local](architecture/ENTORNO-LOCAL.md), compilar contratos e instalar Chromium según la guía de desarrollo. Dejar libre el puerto 4173. Desde la raíz:

```sh
npm run build:contracts
npm run test:auth:practica --workspace @vitafarma/frontend
```

La prueba abre Chromium, inicia sesión con el operador local, comprueba la identidad con Auth, recarga, reabre el inventario en otra pestaña y cierra sesión. Después intenta volver a la ruta protegida y verifica el regreso al formulario de acceso. La [captura de la pantalla de acceso](planning/evidencias/acceso-local-2026-11-18.png) corresponde a la práctica del 18/11 con los campos vacíos.
