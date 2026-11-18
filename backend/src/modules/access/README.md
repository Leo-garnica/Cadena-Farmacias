# Acceso

El guard global verifica los tokens de Supabase Auth con JWKS, emisor del proyecto, audiencia `authenticated`, caducidad y sujeto. El mapa privado del servidor asigna a cada sujeto reconocido un perfil y sus sucursales. El módulo expone `CurrentAccess`, el tipo `AccessGrant` y la ruta `GET /api/v1/me`. El login utiliza Supabase Auth. Las consultas de acceso no leen contraseñas de tablas académicas. [Configuración de servidor](../../../README.md)
