import type { PropsWithChildren } from 'react'

export function StatusBadge({ tone = 'neutral', children }: PropsWithChildren<{ tone?: 'neutral' | 'success' | 'warning' | 'danger' }>) {
  return <span className={`status-badge status-badge--${tone}`}><span className="status-dot" aria-hidden="true" />{children}</span>
}
