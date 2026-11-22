import { createHash, createHmac, createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, randomUUID, sign, verify } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { prepareManagement } from './gestion.mjs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const local = dirname(fileURLToPath(import.meta.url))
const state = join(homedir(), '.vitafarma', 'practica-v1')
const settingsFile = join(state, 'practica.json')
const url = 'http://127.0.0.1:55433'
const issuer = url + '/auth/v1'
const rand = () => randomBytes(30).toString('base64url')
const accounts = [
  { id: '00000000-0000-4000-8000-000000000001', email: 'operador@vitafarma.test', perfil: 'consulta', sucursales: [1] },
  { id: '00000000-0000-4000-8000-000000000002', email: 'supervisor@vitafarma.test', perfil: 'responsable', sucursales: [1, 2] },
  { id: '00000000-0000-4000-8000-000000000003', email: 'sinacceso@vitafarma.test' },
]
const commerceAccounts = [
  { id: '00000000-0000-4000-8000-000000000004', email: 'jefe.centro@vitafarma.test' },
  { id: '00000000-0000-4000-8000-000000000005', email: 'caja.centro@vitafarma.test' },
  { id: '00000000-0000-4000-8000-000000000006', email: 'cliente@vitafarma.test' },
  { id: '00000000-0000-4000-8000-000000000007', email: 'solicitante@vitafarma.test' },
  { id: '00000000-0000-4000-8000-000000000008', email: 'supervisor.sucre@vitafarma.test' },
  { id: '00000000-0000-4000-8000-000000000009', email: 'jefe.norte@vitafarma.test' },
  { id: '00000000-0000-4000-8000-000000000010', email: 'caja.norte@vitafarma.test' },
  { id: '00000000-0000-4000-8000-000000000011', email: 'jefe.sur@vitafarma.test' },
  { id: '00000000-0000-4000-8000-000000000012', email: 'caja.sur@vitafarma.test' },
]

let localEngine
function docker(args, { env, capture = false, input } = {}) {
  if (localEngine) args = ['--host', localEngine, ...args]
  const result = spawnSync('docker', args, {
    cwd: local, windowsHide: true, stdio: capture ? 'pipe' : input ? ['pipe', 'inherit', 'inherit'] : 'inherit', input,
    encoding: 'utf8', env: { ...process.env, ...env },
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error('Docker devolvió un error. Revisa el motor, los puertos y el estado de los servicios.')
  return result.stdout?.trim()
}

function checkDocker() {
  const selectedContext = process.env.DOCKER_CONTEXT
  const inspect = ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}']
  if (selectedContext) inspect.push(selectedContext)
  const host = (!selectedContext && process.env.DOCKER_HOST) || docker(inspect, { capture: true })
  if (!/^(npipe:\/\/\/\/\.\/pipe\/|unix:\/\/\/)/u.test(host)) {
    throw new Error('Selecciona un motor Docker local con socket Unix o tubería de Windows.')
  }
  localEngine = host
}

function secretFile(file, value, options = {}) {
  writeFileSync(join(state, file), value, { encoding: 'utf8', mode: 0o600, ...options })
}

function loadConfig(command) {
  if (existsSync(settingsFile)) return JSON.parse(readFileSync(settingsFile, 'utf8'))
  if (command !== 'up') throw new Error('Primero ejecuta el comando up de la práctica.')
  const volumes = docker(['volume', 'ls', '--format', '{{.Name}}'], { capture: true }).split(/\r?\n/u)
  if (volumes.includes('vitafarma-practica_datos')) {
    throw new Error('Existe el volumen de práctica, pero faltan sus claves locales. Recupera la carpeta practica-v1 que lo creó.')
  }
  mkdirSync(state, { recursive: true, mode: 0o700 })
  const signingKey = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ format: 'jwk' })
  Object.assign(signingKey, { kid: randomUUID(), alg: 'ES256', use: 'sig', key_ops: ['sign', 'verify'] })
  const config = {
    signingKey, ownerPassword: rand(), authPassword: rand(), readPassword: rand(), jwtSecret: rand(),
    publicKey: 'sb_publishable_' + rand(),
    passwords: Object.fromEntries(accounts.map(account => [account.email, rand()])),
  }
  secretFile('practica.json', JSON.stringify(config), { flag: 'wx' })
  return config
}

function schemaSql() {
  const snapshot = readFileSync(join(local, '../docs/schema-supabase-actual.sql'), 'utf8').replaceAll('\r\n', '\n')
  const digest = createHash('sha256').update(snapshot).digest('hex')
  if (digest !== '4eb2598810690437afb9c05a66bf9d4350cffd56ffb08118ff56b686a2437f30') {
    throw new Error('El esquema de referencia cambió. Revisa y versiona el nuevo baseline antes de importarlo.')
  }
  // El archivo verificado contiene DDL multilínea terminado por punto y coma.
  const ddl = snapshot.match(/^(?:CREATE TABLE IF NOT EXISTS |ALTER TABLE ONLY |CREATE (?:UNIQUE )?INDEX )[^;]+;/gmu)
  if (ddl?.length !== 140) throw new Error('Se esperaban 140 declaraciones de tablas, restricciones e índices.')
  return ddl.join('\n')
}

function prepare(config, commerce) {
  const grants = Object.fromEntries(accounts.filter(account => account.perfil)
    .map(({ id, perfil, sucursales }) => [id, { perfil, sucursales }]))
  const database = 'postgresql://vf_lector:' + config.readPassword + '@127.0.0.1:55432/vitafarma_practica'
  secretFile('backend.env.local', [
    'DATABASE_URL=' + database, 'SUPABASE_URL=' + url,
    "VITAFARMA_ACCESS_MAP='" + JSON.stringify(grants) + "'", '',
  ].join('\n'))
  const frontend = 'VITE_SUPABASE_URL=' + url + '\nVITE_SUPABASE_PUBLISHABLE_KEY=' + config.publicKey + '\n'
  secretFile('frontend.env.local', frontend)
  secretFile('cuentas.json', JSON.stringify(Object.fromEntries(accounts.map(({ email }) => [email, config.passwords[email]])), null, 2))
  if (commerce) {
    secretFile('frontend.comercio.env.local', frontend + 'VITE_VITAFARMA_COMERCIO=1\n')
    const emails = [accounts[1], ...commerceAccounts].map(({ email }) => [email, config.passwords[email]])
    secretFile('cuentas.comercio.json', JSON.stringify(Object.fromEntries(emails), null, 2))
  }
  secretFile('init.sql', [
    '\\getenv read_password VF_PRACTICA_READ', '\\getenv auth_password VF_PRACTICA_AUTH_DB', 'BEGIN;', schemaSql(),
    'REVOKE ALL ON DATABASE vitafarma_practica FROM PUBLIC;',
    'REVOKE ALL ON SCHEMA public FROM PUBLIC;',
    "CREATE ROLE vf_lector LOGIN PASSWORD :'read_password';",
    "CREATE ROLE supabase_auth_admin LOGIN PASSWORD :'auth_password';",
    'GRANT CONNECT ON DATABASE vitafarma_practica TO vf_lector, supabase_auth_admin;',
    'CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;',
    'ALTER ROLE supabase_auth_admin SET search_path = auth;',
    'GRANT USAGE ON SCHEMA public TO vf_lector;',
    'GRANT SELECT ON public.farmacia, public.ciudad, public.categoria, public.producto, public.stock, public.lote, public.medicamento TO vf_lector;',
    'ALTER ROLE vf_lector SET default_transaction_read_only = on;',
    'COMMIT;', '',
  ].join('\n'))
  // El entrypoint lee este DDL sin secretos como el usuario postgres del contenedor.
  chmodSync(join(state, 'init.sql'), 0o644)
}

function compose(config, args, options = {}) {
  const env = {
    VF_PRACTICA_OWNER: config.ownerPassword, VF_PRACTICA_AUTH_DB: config.authPassword, VF_PRACTICA_READ: config.readPassword,
    VF_PRACTICA_JWT_SECRET: config.jwtSecret,
    VF_PRACTICA_JWT_KEYS: JSON.stringify([config.signingKey]),
    VF_PRACTICA_PUBLIC_KEY: config.publicKey,
    VF_PRACTICA_INIT_PATH: join(state, 'init.sql').replaceAll('\\', '/'),
    ...options.env,
  }
  return docker(['compose', '-p', 'vitafarma-practica', '-f', join(local, 'compose.yml'), ...args], { ...options, env })
}

function adminToken(config) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const header = encode({ alg: 'ES256', typ: 'JWT', kid: config.signingKey.kid })
  const payload = encode({ role: 'service_role', iss: issuer, aud: 'authenticated', iat: now, exp: now + 60 })
  const body = header + '.' + payload
  const key = createPrivateKey({ key: config.signingKey, format: 'jwk' })
  return body + '.' + sign('sha256', Buffer.from(body), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')
}

async function request(config, path, { method = 'GET', body, bearer } = {}) {
  const headers = { apikey: config.publicKey, 'Content-Type': 'application/json' }
  if (bearer) headers.Authorization = 'Bearer ' + bearer
  return fetch(issuer + path, { method, headers, body: body && JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(10000) })
}

async function provisionAccounts(config, identities) {
  const admin = adminToken(config)
  for (const account of identities) {
    const existing = await request(config, '/admin/users/' + account.id, { bearer: admin })
    if (existing.ok && (await existing.json()).email === account.email) continue
    if (existing.status !== 404) throw new Error('No se pudo comprobar la identidad local (' + existing.status + ').')
    const created = await request(config, '/admin/users', {
      method: 'POST', bearer: admin, body: {
        id: account.id, email: account.email, password: config.passwords[account.email], email_confirm: true,
      },
    })
    if (!created.ok || (await created.json()).id !== account.id) throw new Error('Error al aprovisionar la identidad de prueba (' + created.status + ').')
  }
}

async function review(config) {
  compose(config, ['exec', '-T', '-e', 'PGPASSWORD', 'db', 'psql', '-X', '-h', '127.0.0.1', '-U', 'vf_lector',
    '-d', 'vitafarma_practica', '-f', '/opt/practica/verificar.sql'], { env: { PGPASSWORD: config.readPassword } })
  const origin = 'http://127.0.0.1:5173'
  const cors = await fetch(issuer + '/token', {
    method: 'OPTIONS', redirect: 'error', signal: AbortSignal.timeout(10000), headers: {
      Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'apikey,authorization,content-type',
    },
  })
  if (!cors.ok || cors.headers.get('access-control-allow-origin') !== origin ||
      !cors.headers.get('access-control-allow-headers')?.includes('apikey')) throw new Error('El navegador local no puede iniciar sesión por CORS.')
  const published = await request(config, '/.well-known/jwks.json')
  if (!published.ok) throw new Error('La consulta JWKS falló.')
  const { keys } = await published.json()
  const publicKey = keys.find(key => key.kid === config.signingKey.kid && key.alg === 'ES256')
  if (!publicKey || keys.some(key => key.d || key.k)) throw new Error('El servidor no publicó la clave pública esperada.')
  const key = createPublicKey({ key: publicKey, format: 'jwk' })
  for (const { id, email } of accounts) {
    const response = await request(config, '/token?grant_type=password', {
      method: 'POST', body: { email, password: config.passwords[email] },
    })
    if (!response.ok) throw new Error('Fallo al iniciar sesión de prueba (' + response.status + ').')
    const { access_token: token } = await response.json()
    const [header, body, signature] = token.split('.')
    const claims = JSON.parse(Buffer.from(body, 'base64url'))
    if (!verify('sha256', Buffer.from(header + '.' + body), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'base64url')) ||
        claims.iss !== issuer || claims.aud !== 'authenticated' || claims.sub !== id || claims.exp <= Date.now() / 1000) {
      throw new Error('Firma, identidad o vigencia de la cuenta local incorrectas.')
    }
    const user = await request(config, '/user', { bearer: token })
    if (!user.ok || (await user.json()).id !== id) throw new Error('Identidad local no verificada.')
    const logout = await request(config, '/logout?scope=local', { method: 'POST', bearer: token })
    if (!logout.ok) throw new Error('Fallo en el cierre local de la sesión de prueba.')
  }
  console.log('PostgreSQL, permisos efectivos, JWKS, firma ES256 y tres sesiones de Supabase Auth verificados.')
}

async function main() {
  const command = process.argv[2]
  if (!['up', 'verify', 'stop', 'gestion', 'comercio'].includes(command)) throw new Error('Uso: node local/practica.mjs up | verify | stop | gestion | comercio')
  const commerce = command === 'comercio' || process.argv[3] === '--comercio'
  checkDocker()
  const config = loadConfig(command)
  if (command === 'gestion' || command === 'comercio') return prepareManagement({ config, compose, schemaSql, secretFile, state, commerce })
  if (command === 'stop') return compose(config, ['stop'])
  if (command === 'up') {
    if (commerce) {
      for (const { email } of commerceAccounts) {
        config.passwords[email] ??= createHmac('sha256', config.ownerPassword).update('vitafarma-comercio:' + email).digest('base64url')
      }
    }
    prepare(config, commerce)
    compose(config, ['up', '-d', '--wait', '--wait-timeout', '120'], { env: { VF_PRACTICA_DISABLE_SIGNUP: commerce ? 'false' : 'true' } })
    await provisionAccounts(config, commerce ? [...accounts, ...commerceAccounts] : accounts)
  }
  await review(config)
  console.log('Configuración y cuentas de práctica en ' + state)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
