# Portal de repositorios

Worker de Cloudflare que lista tus repositorios públicos de GitHub y GitLab, y te deja editar nombre, descripción, módulo, orden y visibilidad desde `/admin`.

## Despliegue

```bash
npm install
npx wrangler login

# 1. Crear el KV (guarda tus ediciones) y pegar el id en wrangler.jsonc
npx wrangler kv namespace create KV

# 2. Definir tu usuario en wrangler.jsonc (vars.GITHUB_USER / GITLAB_USER)

# 3. Token del panel admin (elige uno largo y aleatorio)
npx wrangler secret put ADMIN_TOKEN

# 4. Opcionales: suben el límite de las APIs (solo lectura, repos públicos)
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put GITLAB_TOKEN

npx wrangler deploy
```

Para probar en local: crea un archivo `.dev.vars` con `ADMIN_TOKEN=prueba` y ejecuta `npm run dev`.

## Uso

- `/` es el portal que ven tus estudiantes.
- `/admin` pide el token y permite crear módulos, asignar repos a módulos, renombrarlos, cambiar descripciones, ordenarlos y ocultarlos.
- Los forks aparecen ocultos por defecto; desmarca "Ocultar" para mostrarlos. Los repos archivados nunca se muestran.
- Los datos de GitHub/GitLab se cachean 30 minutos. En el admin, "Volver a leer" fuerza la actualización.
- Tus ediciones se guardan en KV y se aplican por encima de los datos originales, así que un repo nuevo aparece solo en "Otros" hasta que lo asignes.

## Seguridad

El token del admin viaja en cada petición al panel; usa siempre HTTPS (el dominio de workers.dev ya lo es). Para más protección, puedes poner `/admin*` y `/api/admin/*` detrás de Cloudflare Access.
