import { Outlet } from 'react-router'
import { AuthProvider, LoginPage } from '../modules/access/public'
import { authRepository } from './repositories'
import { Brand } from './Brand'

export function SessionLayout() {
  return <AuthProvider repository={authRepository}><Outlet /></AuthProvider>
}

export function LoginRoute() {
  return <LoginPage brand={<Brand />} />
}
