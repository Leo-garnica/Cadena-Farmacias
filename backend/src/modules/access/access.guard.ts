import { createParamDecorator, ForbiddenException, Inject, Injectable, ServiceUnavailableException, SetMetadata, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { AccessGrant } from '@vitafarma/contracts/common'
import { createRemoteJWKSet, errors, jwtVerify } from 'jose'

const publicRoute = Symbol('public route')
export const PublicEndpoint = () => SetMetadata(publicRoute, true)
export type { AccessGrant } from '@vitafarma/contracts/common'
export interface AccessRequest {
  headers: { authorization?: string }
  access: AccessGrant
}
export const CurrentAccess = createParamDecorator((_data: unknown, ctx: ExecutionContext) =>
  ctx.switchToHttp().getRequest<AccessRequest>().access)

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

function readGrants(raw?: string) {
  const map = new Map<string, AccessGrant>()
  const values: unknown = JSON.parse(raw || '{}')
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error()
  for (const [sub, grant] of Object.entries(values)) {
    if (!uuid.test(sub) || !grant || !['consulta', 'responsable'].includes(grant.perfil)
      || !Array.isArray(grant.sucursales) || !grant.sucursales.length
      || !grant.sucursales.every((id: unknown) => typeof id === 'number' && Number.isInteger(id) && id > 0 && id <= 2147483647)) throw new Error()
    map.set(sub, { sub, perfil: grant.perfil, sucursales: [...new Set<number>(grant.sucursales)] })
  }
  return map
}

function authenticator(env: NodeJS.ProcessEnv) {
  try {
    const project = new URL(env.SUPABASE_URL ?? '')
    if (project.username || project.password || project.search || project.hash || project.pathname !== '/') return null
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(project.hostname)
    if (project.protocol !== 'https:' && !(loopback && project.protocol === 'http:')) return null
    const issuer = project.origin + '/auth/v1'
    const jwks = createRemoteJWKSet(new URL(issuer + '/.well-known/jwks.json'), { timeoutDuration: 4000 })
    return { issuer, jwks, grants: readGrants(env.VITAFARMA_ACCESS_MAP) }
  } catch { return null }
}

@Injectable()
export class AccessGuard implements CanActivate {
  private readonly auth = authenticator(process.env)

  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(publicRoute, [context.getHandler(), context.getClass()])) return true
    const request = context.switchToHttp().getRequest<AccessRequest>()
    const bearer = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(request.headers.authorization ?? '')?.[1]
    if (!bearer || bearer.length > 8192) throw new UnauthorizedException()
    if (!this.auth) throw new ServiceUnavailableException()
    const { issuer, jwks, grants } = this.auth
    let subject: string
    try {
      const { payload } = await jwtVerify(bearer, jwks, {
        algorithms: ['ES256', 'RS256'], issuer, audience: 'authenticated', requiredClaims: ['exp', 'sub'],
      })
      if (typeof payload.sub !== 'string' || !uuid.test(payload.sub) || payload.role !== 'authenticated' || payload.is_anonymous === true) {
        throw new UnauthorizedException()
      }
      subject = payload.sub
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      if (error instanceof errors.JWTExpired || error instanceof errors.JWTClaimValidationFailed
        || error instanceof errors.JWSInvalid || error instanceof errors.JWTInvalid || error instanceof errors.JOSEAlgNotAllowed
        || error instanceof errors.JWSSignatureVerificationFailed || error instanceof errors.JWKSNoMatchingKey) throw new UnauthorizedException()
      throw new ServiceUnavailableException()
    }
    const grant = grants.get(subject)
    if (!grant) throw new ForbiddenException()
    request.access = grant
    return true
  }
}
