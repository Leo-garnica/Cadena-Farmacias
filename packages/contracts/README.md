# Contratos públicos

Paquete privado `@vitafarma/contracts`, compartido por frontend y backend mediante
npm workspaces. No tiene dependencias de ejecución ni importa React, NestJS o drivers.

| Entrada | Contenido |
| --- | --- |
| `@vitafarma/contracts/common` | `DateOnly`, identidad con perfil y sucursales, y error público de API |
| `@vitafarma/contracts/inventory` | Consulta, resultado, metadatos, proyecciones de lectura e indicadores de inventario |
| `@vitafarma/contracts/health` | Estado del proceso de la API PostgreSQL |

Importar con `import type` cuando solo se necesita un tipo. Las entradas resuelven
`dist/`; antes de iniciar o verificar consumidores, `npm run build:contracts` desde
la raíz. Los comandos raíz ya incluyen ese paso cuando corresponde.

Los nombres y nulos de las proyecciones se conservaron desde el piloto. No son un ORM,
un diccionario completo de la BD o una autorización para exponer todas sus columnas.
Nunca añadir contraseñas, claves, tokens o datos de fixtures a este paquete.

Ante cambios incompatibles, enumerar consumidores, aprobar el impacto y actualizar
frontend, backend y pruebas juntos. No importar código fuente de una app desde otra.
