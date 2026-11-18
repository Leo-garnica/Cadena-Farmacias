import { useId, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, Search } from 'lucide-react'
import { useQuery, pageSize, type Entries, type Option } from './data'

export function Status({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="practice-status" role={retry ? 'alert' : 'status'}>{message}{retry && <button className="practice-button" type="button" onClick={retry}><RotateCw size={15} aria-hidden="true" />Reintentar</button>}</div>
}

export function Pager({ offset, total, length, change }: { offset: number; total: number; length: number; change: (offset: number) => void }) {
  if (offset === 0 && total <= length) return null
  return <div className="practice-pager">
    <button className="practice-button" type="button" disabled={offset === 0} onClick={() => change(Math.max(0, offset - pageSize))}><ArrowLeft size={15} aria-hidden="true" />Anterior</button>
    <span>{total && length ? `${offset + 1}–${offset + length} de ${total}` : 'Sin resultados'}</span>
    <button className="practice-button" type="button" disabled={!length || offset + length >= total} onClick={() => change(offset + length)}>Siguiente<ArrowRight size={15} aria-hidden="true" /></button>
  </div>
}

export function SearchBox({ search, label }: { search: (term: string) => void; label: string }) {
  const id = useId()
  const [text, setText] = useState('')
  function submit(e: FormEvent) { e.preventDefault(); search(text.trim()) }
  return <form className="practice-search" role="search" onSubmit={submit}><label htmlFor={id}>{label}</label>
    <div><input id={id} maxLength={100} type="search" value={text} onChange={e => setText(e.target.value)} /><button className="practice-button" type="submit"><Search size={16} aria-hidden="true" />Buscar</button></div>
  </form>
}

export function ReferencePicker({ label, reference, value, onChange, branch, required = true, disabled = false }: {
  label: string; reference: string; value: string; onChange: (id: string, name: string) => void; branch?: string; required?: boolean; disabled?: boolean
}) {
  const id = useId()
  const [term, setTerm] = useState('')
  const [offset, setOffset] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null)
  const params = new URLSearchParams({ offset: String(offset), q: term })
  if (branch) params.set('farmacia', branch)
  const options = useQuery<Entries<Option>>(disabled ? null : `/practica/opciones/${reference}?${params}`)
  const rows = options.data?.filas ?? []
  const missingSelection = value && !rows.some(row => String(row.id) === value)
  return <div className="practice-reference"><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    <select id={id} required={required} value={value} disabled={disabled} onChange={e => {
      const name = e.target.selectedOptions[0]?.textContent ?? e.target.value
      setSelected({ id: e.target.value, name }); onChange(e.target.value, name)
    }}>
      <option value="">{options.loading ? 'Cargando opciones…' : 'Selecciona una opción'}</option>
      {missingSelection && <option value={value}>{selected?.id === value ? selected.name : `Registro #${value}`}</option>}
      {rows.map(row => <option key={row.id} value={row.id}>{row.nombre || 'Sin nombre'} · #{row.id}</option>)}
    </select>
    {options.error && <Status message={options.error} retry={options.refresh} />}
    {!disabled && (filterOpen || (options.data?.total ?? 0) > rows.length) && <div className="practice-ref-tools">
      <button type="button" className="practice-text" aria-expanded={filterOpen} onClick={() => setFilterOpen(open => !open)}>Filtrar opciones de {label.toLowerCase()}</button>
      {filterOpen && <><input aria-label={`Filtrar ${label}`} type="search" maxLength={100} value={term} onChange={e => { setTerm(e.target.value); setOffset(0) }} />
        <Pager total={options.data?.total ?? 0} length={rows.length} offset={offset} change={setOffset} /></>}
    </div>}
  </div>
}
