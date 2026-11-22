export interface AuthIdentity {
  id: string
  email: string | null
}

/** Authentication only: this identity grants no employee, role or branch permissions. */
export interface AuthRepository {
  readonly configured: boolean
  currentUser(): Promise<AuthIdentity | null>
  accessToken(): Promise<string | null>
  signIn(email: string, password: string): Promise<AuthIdentity>
  register(email: string, password: string): Promise<AuthIdentity | null>
  signOut(): Promise<'complete' | 'local-only'>
  subscribe(listener: (userId: string | null) => void): () => void
}

export class AccessError extends Error {
  constructor(public readonly code: 'configuration' | 'credentials' | 'registration' | 'unavailable' | 'rate-limit') {
    super(code)
  }
}
