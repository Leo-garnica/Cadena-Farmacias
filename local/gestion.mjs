import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'

export function prepareManagement({ config, compose, schemaSql, secretFile, state }) {
  const writer = createHmac('sha256', config.ownerPassword).update('vitafarma-gestion-local-v1').digest('base64url')
  const psql = (database, input) => compose(config,
    ['exec', '-T', '-e', 'VF_GESTION_CLAVE', 'db', 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database],
    { input, env: { VF_GESTION_CLAVE: writer } })
  psql('vitafarma_practica', `SELECT 'CREATE DATABASE vitafarma_gestion' WHERE NOT EXISTS
    (SELECT FROM pg_database WHERE datname='vitafarma_gestion') \\gexec
`)
  const seed = readFileSync(new URL('./datos.sql', import.meta.url), 'utf8').replace(/^BEGIN;|^COMMIT;/gmu, '')
  const definitions = readFileSync(new URL('./gestion.sql', import.meta.url), 'utf8')
  psql('vitafarma_gestion', `\\getenv writer_password VF_GESTION_CLAVE
BEGIN;
SELECT pg_advisory_xact_lock(17041);
SELECT to_regclass('practica_api.instalacion') IS NULL AS necesita_init \\gset
\\if :necesita_init
${schemaSql()}
${seed}
${definitions}
\\endif
GRANT SELECT ON public.lote TO vf_gestion;
COMMIT;
`)
  const base = readFileSync(state + '/backend.env.local', 'utf8').replace('/vitafarma_practica', '/vitafarma_gestion')
    .replace(/^(VITAFARMA_ACCESS_MAP=)'(.+)'$/mu, (_, key, encoded) => {
      const grants = JSON.parse(encoded)
      grants['00000000-0000-4000-8000-000000000002'].sucursales.push(3)
      return key + "'" + JSON.stringify(grants) + "'"
    })
  secretFile('backend.gestion.env.local', base + 'VITAFARMA_PRACTICA_WRITE_URL=postgresql://vf_gestion:' + writer + '@127.0.0.1:55432/vitafarma_gestion\n')
  console.log('Gestión académica disponible en el archivo privado backend.gestion.env.local.')
}
