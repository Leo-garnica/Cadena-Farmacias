import { Injectable, Module, ServiceUnavailableException, type OnApplicationShutdown } from '@nestjs/common'
import pg, { type PoolClient, type PoolConfig } from 'pg'

const readTables = ['farmacia', 'ciudad', 'categoria', 'producto', 'stock', 'lote', 'medicamento']

function connection(raw?: string): PoolConfig | undefined {
  try {
    if (!raw) return
    const url = new URL(raw)
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.username || !url.password || !/^\/[\w-]+$/.test(url.pathname) || url.hash) return
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if ([...url.searchParams].some(([key, value]) => key !== 'sslmode' || !(value === 'verify-full' || (local && value === 'disable')))) return
    const user = decodeURIComponent(url.username)
    if (/^(postgres|service_role|supabase_admin)(\.|$)/iu.test(user)) return
    return {
      host: url.hostname.replace(/^\[|\]$/g, ''), port: Number(url.port || 5432), database: url.pathname.slice(1),
      user, password: decodeURIComponent(url.password), ssl: !local || url.searchParams.get('sslmode') === 'verify-full' ? { rejectUnauthorized: true } : false,
      max: 6, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000, statement_timeout: 4000,
      query_timeout: 6000, application_name: 'vitafarma-lecturas',
    }
  } catch { return }
}

// Check effective privileges on the connection used by the request, including inherited grants.
const privileges = `
  SELECT NOT (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb OR r.rolreplication)
    AND NOT has_schema_privilege(current_user, 'public', 'CREATE')
    AND NOT has_database_privilege(current_user, current_database(), 'CREATE')
    AND (SELECT bool_and(has_table_privilege(current_user, format('public.%I', t), 'SELECT')) FROM unnest($1::text[]) t)
    AND NOT EXISTS (
      SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r','p','v','m','f')
        AND (has_table_privilege(current_user, c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER')
          OR has_any_column_privilege(current_user, c.oid, 'INSERT,UPDATE')
          OR (c.relname <> ALL($1::text[]) AND has_any_column_privilege(current_user, c.oid, 'SELECT')))
    ) AS allowed FROM pg_roles r WHERE r.rolname = current_user`

@Injectable()
export class ReadDatabase implements OnApplicationShutdown {
  private readonly pool?: pg.Pool

  constructor() {
    const config = connection(process.env.DATABASE_URL)
    if (config) {
      this.pool = new pg.Pool(config)
      // The pool discards an idle connection on error; the next request gets its own connection.
      this.pool.on('error', () => {})
    }
  }

  async read<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) throw new ServiceUnavailableException()
    let client: PoolClient | undefined
    let discard = false
    try {
      client = await this.pool.connect()
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
      const rights = await client.query<{ allowed: boolean }>(privileges, [readTables])
      if (!rights.rows[0]?.allowed) throw new Error('Permisos de lectura incompatibles')
      const result = await operation(client)
      await client.query('COMMIT')
      return result
    } catch {
      discard = true
      throw new ServiceUnavailableException()
    } finally {
      // A discarded connection also terminates any unfinished transaction.
      client?.release(discard)
    }
  }

  async check() {
    await this.read(client => client.query('SELECT id_farmacia FROM public.farmacia LIMIT 1'))
  }

  async onApplicationShutdown() { await this.pool?.end() }
}

@Module({ providers: [ReadDatabase], exports: [ReadDatabase] })
export class ReadDatabaseModule {}
