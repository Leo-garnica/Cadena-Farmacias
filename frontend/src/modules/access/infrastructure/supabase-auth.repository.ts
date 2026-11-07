import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { AccessError, type AuthIdentity, type AuthRepository } from '../application/auth.repository'

function createAuthClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key?.startsWith('sb_publishable_')) return null
  try {
    const parsed = new URL(url)
    const local = ['localhost', '127.0.0.1'].includes(parsed.hostname)
    if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') return null
    if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) return null
    return createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      global: {
        fetch: (input, init) => fetch(input, {
          ...init,
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(10_000)])
            : AbortSignal.timeout(10_000),
        }),
      },
    })
  } catch { return null }
}

const identity = (user: User): AuthIdentity => ({ id: user.id, email: user.email ?? null })

class SupabaseAuthRepository implements AuthRepository {
  private verification: Promise<AuthIdentity | null> | null = null
  constructor(private readonly client: SupabaseClient | null) {}

  get configured() { return this.client !== null }

  private requireClient() {
    if (!this.client) throw new AccessError('configuration')
    return this.client
  }

  currentUser(): Promise<AuthIdentity | null> {
    // Parallel route loaders share the in-flight check, never a cached authorization.
    this.verification ??= this.verifyUser().finally(() => { this.verification = null })
    return this.verification
  }

  private async verifyUser(): Promise<AuthIdentity | null> {
    const client = this.requireClient()
    try {
      // getSession refreshes expired tokens; getUser verifies identity with Auth.
      // Browser storage alone is never treated as a verified identity.
      const { data: { session }, error: sessionError } = await client.auth.getSession()
      if (sessionError) throw new AccessError('unavailable')
      if (!session) return null
      const { data, error } = await client.auth.getUser(session.access_token)
      if (error) {
        if (error.status === 401 || error.status === 403 || error.code === 'session_not_found' || error.code === 'user_not_found') {
          await this.signOut()
          return null
        }
        throw new AccessError('unavailable')
      }
      // Discard a response if the account was changed or signed out during verification.
      const latest = await client.auth.getSession()
      if (latest.data.session?.user.id !== data.user.id) return null
      return identity(data.user)
    } catch (error) {
      if (error instanceof AccessError) throw error
      throw new AccessError('unavailable')
    }
  }

  async signIn(email: string, password: string): Promise<AuthIdentity> {
    const client = this.requireClient()
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.status === 429) throw new AccessError('rate-limit')
        if (error.status === 400 || error.status === 422 || error.status === 401) throw new AccessError('credentials')
        throw new AccessError('unavailable')
      }
      if (!data.user || !data.session) throw new AccessError('credentials')
      return identity(data.user)
    } catch (error) {
      if (error instanceof AccessError) throw error
      throw new AccessError('unavailable')
    }
  }

  async signOut(): Promise<'complete' | 'local-only'> {
    const client = this.requireClient()
    const { error } = await client.auth.signOut({ scope: 'local' })
    if (!error) return 'complete'
    // SDK 2.119 clears local storage before attempting remote revocation.
    const remaining = await client.auth.getSession()
    if (!remaining.error && !remaining.data.session) return 'local-only'
    throw new AccessError('unavailable')
  }

  subscribe(listener: (userId: string | null) => void) {
    if (!this.client) return () => {}
    const { data } = this.client.auth.onAuthStateChange((_event, session) => listener(session?.user.id ?? null))
    return () => data.subscription.unsubscribe()
  }
}

export const supabaseAuthRepository: AuthRepository = new SupabaseAuthRepository(createAuthClient())
