export interface AuthIdentity {
  id: string
  email: string | null
}

/** Authentication only: this identity grants no employee, role or branch permissions. */
export interface AuthRepository {
  readonly configured: boolean
  currentUser(): Promise<AuthIdentity | null>
  signIn(email: string, password: string): Promise<AuthIdentity>
  signOut(): Promise<'complete' | 'local-only'>
  subscribe(listener: (userId: string | null) => void): () => void
}

export class AccessError extends Error {
  constructor(public readonly code: 'configuration' | 'credentials' | 'unavailable' | 'rate-limit') {
    super(code)
  }
}
