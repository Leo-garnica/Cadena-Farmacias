import * as RadixTabs from '@radix-ui/react-tabs'
import { m, useReducedMotion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { easeOut, motionTiming } from '../motion/presets'

export function Tabs({ value, onValueChange, label, items }: {
  value: string; onValueChange: (value: string) => void; label: string
  items: { value: string; label: string; content: ReactNode }[]
}) {
  const id = useId()
  const reduced = useReducedMotion()
  return <RadixTabs.Root value={value} onValueChange={onValueChange} className="tabs">
    <RadixTabs.List aria-label={label} className="tabs__list">
      {items.map((item) => <RadixTabs.Trigger key={item.value} value={item.value} className="tabs__trigger">
        {item.label}{value === item.value ? <m.span aria-hidden="true" className="tabs__indicator" layoutId={reduced ? undefined : `tab-${id}`} transition={{ duration: reduced ? 0 : motionTiming.content, ease: easeOut }} /> : null}
      </RadixTabs.Trigger>)}
    </RadixTabs.List>
    {items.map((item) => <RadixTabs.Content className="tabs__content" value={item.value} key={item.value}>{item.content}</RadixTabs.Content>)}
  </RadixTabs.Root>
}
