import * as Dialog from '@radix-ui/react-dialog'
import { m, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { easeOut, motionTiming } from '../motion/presets'

export function Drawer({ open, onOpenChange, title, description, children, returnFocusId, side = 'right' }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description: string
  children: ReactNode; returnFocusId?: string; side?: 'left' | 'right'
}) {
  const reduced = useReducedMotion()
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="drawer-overlay" />
      <Dialog.Content asChild onCloseAutoFocus={(event) => {
        event.preventDefault()
        requestAnimationFrame(() => (document.getElementById(returnFocusId ?? 'inventory-title') ?? document.getElementById('inventory-title'))?.focus({ preventScroll: true }))
      }} onOpenAutoFocus={(event) => {
        event.preventDefault()
        document.getElementById('drawer-title')?.focus({ preventScroll: true })
      }}>
        <m.section className={`drawer drawer--${side}`} initial={reduced ? false : { x: side === 'right' ? 32 : -32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: reduced ? 0 : motionTiming.panel, ease: easeOut }}>
          <div className="drawer__heading">
            <div><Dialog.Title id="drawer-title" tabIndex={-1}>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div>
            <Dialog.Close className="button button--ghost icon-button" aria-label="Cerrar panel"><X size={20} aria-hidden="true" /></Dialog.Close>
          </div>
          <div className="drawer__body">{children}</div>
        </m.section>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
