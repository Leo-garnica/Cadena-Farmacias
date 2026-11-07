import { AccessGate, LoginPage } from '../modules/access/public'
import { AppShell } from './AppShell'
import { Brand } from './Brand'
import { InventoryError } from './RouteStates'

export function ProtectedShell() { return <AccessGate><AppShell /></AccessGate> }
export function LoginRoute() { return <LoginPage brand={<Brand />} /> }
export function ProtectedError() { return <AccessGate><InventoryError /></AccessGate> }
