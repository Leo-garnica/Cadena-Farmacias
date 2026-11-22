import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'

export function prepareManagement({ config, compose, schemaSql, secretFile, state, commerce = false }) {
  const database = commerce ? 'vitafarma_comercio' : 'vitafarma_gestion'
  const envFile = commerce ? 'backend.comercio.env.local' : 'backend.gestion.env.local'
  const writer = createHmac('sha256', config.ownerPassword).update('vitafarma-gestion-local-v1').digest('base64url')
  const psql = (database, input) => compose(config,
    ['exec', '-T', '-e', 'VF_GESTION_CLAVE', 'db', 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database],
    { input, env: { VF_GESTION_CLAVE: writer } })
  psql('vitafarma_practica', `SELECT 'CREATE DATABASE ${database}' WHERE NOT EXISTS
    (SELECT FROM pg_database WHERE datname='${database}') \\gexec
`)
  const seed = readFileSync(new URL('./datos.sql', import.meta.url), 'utf8').replace(/^BEGIN;|^COMMIT;/gmu, '')
  const definitions = readFileSync(new URL('./gestion.sql', import.meta.url), 'utf8')
  const commerceSql = commerce ? ['comercio-accesos.sql', 'comercio.sql']
    .map(name => readFileSync(new URL('./' + name, import.meta.url), 'utf8')).join('\n') : ''
  psql(database, `\\getenv writer_password VF_GESTION_CLAVE
BEGIN;
SELECT pg_advisory_xact_lock(17041);
SELECT to_regclass('practica_api.instalacion') IS NULL AS necesita_init \\gset
\\if :necesita_init
${schemaSql()}
${seed}
${definitions.replaceAll('vitafarma_gestion', database)}
\\endif
GRANT SELECT ON public.lote TO vf_gestion;
${commerceSql}
COMMIT;
`)
  const base = readFileSync(state + '/backend.env.local', 'utf8').replace('/vitafarma_practica', '/' + database)
    .replace(/^(VITAFARMA_ACCESS_MAP=)'(.+)'$/mu, (_, key, encoded) => {
      if (commerce) return key + "'{}'"
      const grants = JSON.parse(encoded)
      grants['00000000-0000-4000-8000-000000000002'].sucursales.push(3)
      return key + "'" + JSON.stringify(grants) + "'"
    })
  const writerUrl = 'VITAFARMA_PRACTICA_WRITE_URL=postgresql://vf_gestion:' + writer + '@127.0.0.1:55432/' + database
  secretFile(envFile, base + writerUrl + '\n' + (commerce ? 'VITAFARMA_COMERCIO_LOCAL=1\n' : ''))
  console.log('Configuración privada preparada en ' + envFile)
}
