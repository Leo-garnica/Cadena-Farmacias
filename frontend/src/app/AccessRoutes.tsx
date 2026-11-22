import { AccessGate, SessionControls } from '../modules/access/public'
import { MotionProvider } from '../shared/motion/MotionProvider'
import { AppShell } from './AppShell'
import { InventoryError } from './RouteStates'

export { InventoryPage } from '../modules/inventory/public'

export function ProtectedShell() { return <MotionProvider><AccessGate><AppShell /></AccessGate></MotionProvider> }
export function ProtectedError() { return <AccessGate><InventoryError sessionControls={<SessionControls />} /></AccessGate> }
