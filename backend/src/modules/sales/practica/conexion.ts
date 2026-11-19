import { BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable, ServiceUnavailableException, type OnModuleDestroy } from '@nestjs/common'
import { Pool, type PoolClient } from 'pg'
import type { AccessGrant } from '../../access/public.js'

function destino(raw: string | undefined, usuario: string) {
  try {
    const parsed = new URL(raw ?? '')
    if (parsed.protocol !== 'postgresql:' || parsed.hostname !== '127.0.0.1' || parsed.port !== '55432' ||
        parsed.pathname !== '/vitafarma_gestion' || parsed.username !== usuario || !parsed.password || parsed.search || parsed.hash) return null
    return parsed
  } catch { return null }
}

@Injectable()
export class ConexionPractica implements OnModuleDestroy {
  private pool?: Pool
  async onModuleDestroy() { await this.pool?.end() }
  async usar<T>(access: AccessGrant, operation: (db: PoolClient) => Promise<T>) {
    if (!access || access.perfil !== 'responsable' || !access.sucursales.length) throw new ForbiddenException()
    const url = destino(process.env.VITAFARMA_PRACTICA_WRITE_URL, 'vf_gestion')
    if (!url || !destino(process.env.DATABASE_URL,'vf_lector') ||
        process.env.SUPABASE_URL !== 'http://127.0.0.1:55433') throw new ForbiddenException('Gestión exclusiva de la práctica local')
    if (!this.pool) {
      this.pool = new Pool({ host: '127.0.0.1', port: 55432, database: 'vitafarma_gestion', user: 'vf_gestion',
        password: decodeURIComponent(url.password), ssl: false, max: 4, connectionTimeoutMillis: 3000,
        options: '-c search_path=pg_catalog -c statement_timeout=5000 -c lock_timeout=3500 -c TimeZone=America/La_Paz',
      })
      // pg discards idle clients on disconnect. The next request can reconnect.
      this.pool.on('error', () => {})
    }
    const client = await this.pool.connect().catch(() => { throw new ServiceUnavailableException() })
    let broken = false
    try {
      await client.query('BEGIN')
      const marker = await client.query(`SELECT 1 FROM practica_api.instalacion
        WHERE version='VF-GESTION-LOCAL-1' AND current_user='vf_gestion' AND current_database()='vitafarma_gestion'
        AND NOT EXISTS (SELECT FROM pg_roles WHERE rolname=current_user AND (rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls OR rolreplication))
        AND NOT has_schema_privilege(current_user, 'public', 'CREATE')`)
      if (!marker.rowCount) throw new ForbiddenException()
      const result = await operation(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      try { await client.query('ROLLBACK') } catch { broken = true }
      if (error instanceof HttpException) throw error
      const code = (error as { code?: string }).code
      if (code === '23503' || code === '23505' || code === '55P03' || code === '40001' || code === '40P01') throw new ConflictException()
      if (code === '23502' || code === '23514' || code?.startsWith('22')) throw new BadRequestException()
      throw new ServiceUnavailableException()
    } finally { client.release(broken) }
  }
}
