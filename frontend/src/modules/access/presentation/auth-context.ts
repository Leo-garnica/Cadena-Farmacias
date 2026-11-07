import { createContext, useContext } from 'react'
import { AccessError, type AuthIdentity } from '../application/auth.repository'

export interface AuthState {
  ready: boolean
  user: AuthIdentity | null
  error: string | null
}

export const AuthContext = createContext<{
  state: AuthState
  notice: string | null
  configured: boolean
  refresh(): Promise<void>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
} | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is required')
  return value
}

export function accessErrorMessage(error: unknown): string {
  if (error instanceof AccessError) {
    if (error.code === 'configuration') return 'El acceso todavía no está configurado. Contacta a la persona responsable del sistema.'
    if (error.code === 'credentials') return 'No pudimos iniciar sesión. Revisa tu correo y contraseña y confirma que tu cuenta esté habilitada.'
    if (error.code === 'rate-limit') return 'Se hicieron demasiados intentos. Espera unos minutos antes de volver a intentar.'
  }
  return 'No pudimos conectar con el servicio de acceso. Revisa tu conexión e inténtalo de nuevo.'
}
