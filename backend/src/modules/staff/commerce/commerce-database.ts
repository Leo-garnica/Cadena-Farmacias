import {
  BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable,
  ServiceUnavailableException, type OnModuleDestroy,
} from '@nestjs/common'
import { Pool, type PoolClient } from 'pg'
import { localCommerceWriter } from '../../access/public.js'

@Injectable()
export class CommerceDatabase implements OnModuleDestroy {
  private pool?: Pool

  async onModuleDestroy() {
    await this.pool?.end()
  }

  async transaction<T>(operation: (db: PoolClient) => Promise<T>): Promise<T> {
    const url = localCommerceWriter(process.env)
    if (!url) throw new ServiceUnavailableException('Comercio disponible en la práctica local')
    if (!this.pool) {
      this.pool = new Pool({
        host: url.hostname, port: Number(url.port), database: url.pathname.slice(1),
        user: url.username, password: decodeURIComponent(url.password), ssl: false,
        max: 6, connectionTimeoutMillis: 3000,
        options: '-c search_path=pg_catalog -c statement_timeout=7000 -c lock_timeout=5000 -c TimeZone=America/La_Paz',
      })
      this.pool.on('error', () => {})
    }
    const client = await this.pool.connect().catch(() => { throw new ServiceUnavailableException() })
    let discard = false
    try {
      await client.query('BEGIN')
      const marker = await client.query(`SELECT 1 FROM commerce.installation
        WHERE version = 'VF-COMERCIO-LOCAL-1' AND current_user = 'vf_gestion' AND current_database() = 'vitafarma_comercio'
        AND NOT EXISTS (SELECT FROM pg_roles WHERE rolname = current_user
          AND (rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls OR rolreplication))
        AND NOT has_schema_privilege(current_user, 'public', 'CREATE')
        AND NOT has_schema_privilege(current_user, 'commerce', 'CREATE')`)
      if (marker.rowCount !== 1) throw new ForbiddenException()
      const result = await operation(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      try { await client.query('ROLLBACK') } catch { discard = true }
      if (error instanceof HttpException) throw error
      const code = (error as { code?: string } | null)?.code
      if (code === '23503' || code === '23505' || code === '55P03' || code === '40001' || code === '40P01') {
        throw new ConflictException()
      }
      if (code === '23502' || code === '23514' || code?.startsWith('22')) throw new BadRequestException()
      throw new ServiceUnavailableException()
    } finally {
      client.release(discard)
    }
  }
}
