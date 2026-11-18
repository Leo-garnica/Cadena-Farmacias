import { Outlet } from 'react-router'
import { AccessGate, AuthProvider, LoginPage, SessionControls } from '../modules/access/public'
import { authRepository } from './repositories'
import { AppShell } from './AppShell'
import { Brand } from './Brand'
import { InventoryError } from './RouteStates'

export { InventoryPage } from '../modules/inventory/public'

export function SessionLayout() {
  return <AuthProvider repository={authRepository}><Outlet /></AuthProvider>
}
export function ProtectedShell() { return <AccessGate><AppShell /></AccessGate> }
export function LoginRoute() { return <LoginPage brand={<Brand />} /> }
export function ProtectedError() { return <AccessGate><InventoryError sessionControls={<SessionControls />} /></AccessGate> }
