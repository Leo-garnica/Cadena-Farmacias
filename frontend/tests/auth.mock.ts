import { test as base, expect, type BrowserContext } from '@playwright/test'

export const appOrigin = 'http://127.0.0.1:5174'
export const authOrigin = 'https://auth.vitafarma.test'
export const storageKey = 'sb-auth-auth-token'
export const testEmail = 'equipo@example.test'
export const testPassword = 'Only-a-local-test-42!'
const user = {
  id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated',
  email: testEmail, app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {},
  identities: [], created_at: '2026-01-01T00:00:00Z', email_confirmed_at: '2026-01-01T00:00:00Z',
}

export function testSession(expired = false) {
  const exp = Math.floor(Date.now() / 1000) + (expired ? -3600 : 3600)
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', exp, iss: `${authOrigin}/auth/v1` })).toString('base64url'),
    'local-test-signature',
  ].join('.')
  return { access_token: token, refresh_token: 'local-test-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: exp, user }
}

export function authStorageState(expired = false) {
  return { cookies: [], origins: [{ origin: appOrigin, localStorage: [{ name: storageKey, value: JSON.stringify(testSession(expired)) }] }] }
}

export async function mockAuth(context: BrowserContext) {
  const state = { userStatus: 200, tokenStatus: 200, logoutStatus: 204, refreshStatus: 200, tokenDelay: 0, passwordRequests: 0, refreshRequests: 0 }
  await context.route(`${authOrigin}/**`, async (route) => {
    const url = new URL(route.request().url())
    const json = (status: number, body: unknown) => route.fulfill({ status, json: body })
    if (url.pathname === '/auth/v1/token') {
      if (url.searchParams.get('grant_type') === 'refresh_token') {
        state.refreshRequests++
        if (state.refreshStatus !== 200) return json(state.refreshStatus, { error_code: 'refresh_token_not_found', msg: 'Invalid refresh token' })
        return json(200, testSession())
      }
      state.passwordRequests++
      if (state.tokenDelay) await new Promise((resolve) => setTimeout(resolve, state.tokenDelay))
      const body = route.request().postDataJSON() as { email: string; password: string }
      if (state.tokenStatus !== 200) return json(state.tokenStatus, { msg: 'Service unavailable' })
      if (body.email !== testEmail || body.password !== testPassword) return json(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' })
      return json(200, testSession())
    }
    if (url.pathname === '/auth/v1/user') {
      if (state.userStatus !== 200) return json(state.userStatus, { error_code: 'bad_jwt', msg: 'Invalid token' })
      if (!route.request().headers().authorization?.startsWith('Bearer ')) return json(401, { msg: 'Missing token' })
      return json(200, user)
    }
    if (url.pathname === '/auth/v1/logout') {
      if (state.logoutStatus !== 204) return json(state.logoutStatus, { msg: 'Unavailable' })
      return route.fulfill({ status: 204 })
    }
    return json(404, { msg: 'Unexpected Auth request' })
  })
  return state
}

export const test = base.extend({
  storageState: authStorageState(),
  context: async ({ context }, provide) => {
    await mockAuth(context)
    await provide(context)
  },
})
export { expect }
