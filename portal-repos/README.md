# Portal de repositorios

Aplicación web que reúne en un solo lugar los repositorios públicos de GitHub y GitLab, los organiza por módulos y permite personalizar cómo se presentan, sin tocar el código de los proyectos.

**Portal:** <https://portal-repos.juanfvanc.workers.dev>  
**Panel de administración:** <https://portal-repos.juanfvanc.workers.dev/admin>

## Funcionalidades

### Portal público

- **Catálogo unificado:** combina los repositorios de una o varias cuentas de GitHub y GitLab en una sola vista.
- **Organización por módulos:** agrupa los repositorios por materia, tema o proyecto. Los que no tienen módulo aparecen en "Otros".
- **Búsqueda instantánea:** filtra por nombre, descripción, temas (*topics*) y lenguaje de programación mientras se escribe.
- **Orden configurable:** destacados, más recientes, nombre (A–Z) o más estrellas.
- **Tarjetas informativas:** muestran descripción, lenguaje con color, estrellas, temas, fecha de última actualización y la plataforma de origen (GitHub o GitLab).
- **Copiar comando de clonado:** botón que copia `git clone <url>` al portapapeles con confirmación visual.
- **Acceso directo al código:** cada tarjeta enlaza al repositorio original.
- **Perfiles vinculados:** accesos rápidos a los perfiles de GitHub y GitLab configurados.
- **Contadores en vivo:** total de repositorios, módulos y lenguajes presentes.
- **Tema claro y oscuro:** detecta la preferencia del sistema y permite cambiarla manualmente; la elección se recuerda en el navegador.
- **Atajos de teclado:** `/` enfoca el buscador y `Esc` limpia la búsqueda.
- **Estados de carga y error:** esqueletos animados mientras llegan los datos y mensajes claros con opción de reintentar.
- **Diseño adaptable y accesible:** interfaz responsive, navegación por teclado, etiquetas ARIA y respeto por `prefers-reduced-motion`.

### Panel de administración (`/admin`)

- **Acceso protegido:** requiere un token de administrador que se valida en cada petición.
- **Personalización del sitio:** edita el título y el subtítulo del portal.
- **Gestión de cuentas:** agrega, edita o elimina cuentas de GitHub y GitLab (incluidos servidores GitLab autoalojados).
- **Gestión de módulos:** crea, renombra, describe, reordena y elimina módulos.
- **Curaduría de repositorios:** asigna repositorios a módulos, cambia su nombre y descripción, define el orden y los oculta o muestra.
- **Valores por defecto inteligentes:** los forks se ocultan automáticamente y los repositorios archivados nunca se publican.
- **Recarga forzada:** vuelve a leer GitHub y GitLab sin esperar la caché.
- **Vista previa inmediata:** los cambios guardados se reflejan al instante en el portal público.

### Datos e integraciones

- **APIs oficiales:** usa la API de GitHub y la API v4 de GitLab.
- **Caché de 30 minutos:** reduce el consumo de las APIs y acelera la carga del portal.
- **Tokens opcionales:** permiten ampliar el límite de peticiones de las APIs; el portal sigue funcionando sin ellos.
- **Ediciones persistentes:** los cambios del panel se guardan en Cloudflare KV y se aplican por encima de los datos originales.
- **Sin copia del código:** la aplicación solo almacena metadatos; el código sigue viviendo en GitHub y GitLab.
- **Solo contenido público:** los repositorios privados no se listan.

## Rutas de la aplicación

| Ruta | Descripción |
| --- | --- |
| `/` | Portal público con el catálogo de repositorios. |
| `/admin` | Panel de administración protegido por token. |
| `GET /api/repos` | Datos públicos del portal: sitio, módulos, repositorios y cuentas. |
| `GET /api/admin/data` | Configuración completa y repositorios (incluye ocultos). Admite `?refresh=1`. |
| `PUT /api/admin/config` | Guarda la configuración y las personalizaciones. |

## Tecnologías

- **Cloudflare Workers** para el backend y el enrutamiento.
- **Cloudflare KV** para persistencia de la configuración.
- **Cache API** para la caché de las respuestas de GitHub y GitLab.
- **HTML, CSS y JavaScript nativos** en el frontend, sin frameworks ni compilación.
- **Wrangler** para desarrollo y despliegue.

## Estructura del proyecto

```text
portal-repos/
├─ public/
│  ├─ index.html    # Portal público
│  ├─ admin.html    # Panel de administración
│  └─ style.css     # Estilos compartidos (portal y panel)
├─ src/
│  └─ index.js      # Worker: API, caché y persistencia
├─ wrangler.jsonc   # Configuración de Cloudflare
└─ package.json
```
