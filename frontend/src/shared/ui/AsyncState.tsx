import { CircleAlert, LoaderCircle, SearchX, FileQuestion } from 'lucide-react'
import type { ReactNode } from 'react'

export function AsyncState({ kind, title, description, action }: { kind: 'loading' | 'error' | 'empty' | 'not-found'; title: string; description: string; action?: ReactNode }) {
  const Icon = { loading: LoaderCircle, error: CircleAlert, empty: SearchX, 'not-found': FileQuestion }[kind]
  return <section className={`async-state async-state--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
    <span className="async-state__icon"><Icon size={28} aria-hidden="true" /></span>
    <h2>{title}</h2><p>{description}</p>{action}
  </section>
}
