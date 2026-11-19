import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'
import concurrently from 'concurrently'

const gestion = process.argv[2] === 'gestion'
const root = fileURLToPath(new URL('../', import.meta.url))
const practica = join(homedir(), '.vitafarma', 'practica-v1')
const preparar = join(root, 'local', 'practica.mjs')
for (const paso of gestion ? ['up', 'gestion'] : ['up']) {
  const resultado = spawnSync(process.execPath, [preparar, paso], { cwd: root, stdio: 'inherit' })
  if (resultado.status !== 0) process.exit(resultado.status ?? 1)
}

const leer = nombre => parseEnv(readFileSync(join(practica, nombre), 'utf8'))
const api = leer(gestion ? 'backend.gestion.env.local' : 'backend.env.local')
const web = leer('frontend.env.local')
if (api.SUPABASE_URL !== 'http://127.0.0.1:55433' || api.SUPABASE_URL !== web.VITE_SUPABASE_URL ||
    new URL(api.DATABASE_URL).host !== '127.0.0.1:55432') {
  throw new Error('El entorno de práctica requiere Auth y PostgreSQL en los puertos locales documentados.')
}
// Do not pass private database credentials to the Vite process or inherit a remote writer.
for (const clave of ['DATABASE_URL', 'SUPABASE_URL', 'VITAFARMA_ACCESS_MAP', 'VITAFARMA_PRACTICA_WRITE_URL']) {
  delete process.env[clave]
}
try {
  await concurrently([
    { name: 'api', command: 'npm run dev --workspace @vitafarma/backend', env: { ...api, PORT: '3000' } },
    { name: 'web', command: 'npm run dev --workspace @vitafarma/frontend', env: web },
  ], { cwd: root, killOthersOn: ['failure', 'success'] }).result
} catch {
  process.exitCode = 1
}
