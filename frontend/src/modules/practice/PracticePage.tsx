import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Plus, Search, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { apiRequest } from '../access/public'
import { Pager, ReferencePicker, SearchBox, Status } from './controls'
import { civilDate, errorMessage, money, useQuery, type Entries, type Field, type Resource, type Row } from './data'
import './practice.css'

type Editor = { action: 'create' } | { action: 'edit' | 'delete'; row: Row }

function labelFor(resource: Resource, key: string) {
  return resource.campos.find(field => field.clave === key)?.etiqueta ?? (key === resource.id ? 'ID' : key === 'total_cobrar' ? 'Total a cobrar' : key.replaceAll('_', ' '))
}
function display(resource: Resource, key: string, value: Row[string]) {
  if (value === null || value === '') return 'Sin registrar'
  const field = resource.campos.find(f => f.clave === key)
  if (field?.tipo === 'fecha') return civilDate(String(value))
  if (field?.tipo === 'importe' || key === 'total_cobrar') return key === 'porcentaje' ? `${value} %` : money(value)
  return String(value)
}
function FieldInput({ field, value, edit, change }: { field: Field; value: string; edit: boolean; change: (value: string) => void }) {
  const disabled = edit && !!field.soloAlta
  if (field.referencia) return <ReferencePicker label={field.etiqueta} reference={field.referencia} value={value} required={field.requerido} disabled={disabled} onChange={change} />
  const id = `practica-${field.clave}`
  const type = field.tipo === 'fecha' ? 'date' : field.tipo === 'importe' || field.tipo === 'entero' ? 'number' : field.clave === 'correo' ? 'email' : 'text'
  return <div><label htmlFor={id}>{field.etiqueta}{field.requerido && <span aria-hidden="true"> *</span>}</label>
    {field.opciones ? <select id={id} value={value} required={field.requerido} onChange={e => change(e.target.value)}><option value="">Selecciona una opción</option>{field.opciones.map(o => <option key={o}>{o}</option>)}</select> :
      <input id={id} type={type} value={value} required={field.requerido} disabled={disabled}
        step={field.tipo === 'importe' ? '0.01' : field.tipo === 'entero' ? '1' : undefined}
        min={field.tipo === 'entero' ? 1 : field.tipo === 'importe' ? (field.clave === 'precio_venta' ? 0.01 : 0) : undefined}
        max={type === 'number' ? field.max : undefined} maxLength={type === 'text' || type === 'email' ? field.max : undefined}
        onChange={e => change(e.target.value)} />}
  </div>
}
function RecordEditor({ resource, editor, finish, cancel }: { resource: Resource; editor: Editor; finish: (notice: string) => void; cancel: () => void }) {
  const editing = editor.action !== 'create'
  const row = editing ? editor.row : {}
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(resource.campos.map(f => [f.clave, String(row[f.clave] ?? '')])))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (locked.current) return
    locked.current = true; setBusy(true); setError('')
    const base = '/practica/registros/' + resource.clave
    try {
      if (editor.action === 'delete') {
        await apiRequest(base + '/' + row[resource.id], { method: 'DELETE' })
        finish('Registro eliminado.')
      } else {
        const body = Object.fromEntries(resource.campos.filter(f => !editing || !f.soloAlta).map(f => [f.clave, values[f.clave].trim() || null]))
        const result = await apiRequest<Row>(editing ? base + '/' + row[resource.id] : base, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) })
        finish(`Registro #${result[resource.id]} ${editing ? 'actualizado' : 'creado'}.`)
      }
    } catch (failure) { setError(await errorMessage(failure)) }
    finally { locked.current = false; setBusy(false) }
  }
  const deleting = editor.action === 'delete'
  return <section className="practice-panel" aria-labelledby="practice-editor">
    <button className="practice-text" onClick={cancel} disabled={busy}><ArrowLeft size={15} aria-hidden="true" /> Volver a la lista</button>
    <h2 id="practice-editor">{deleting ? 'Eliminar registro' : editing ? 'Editar registro' : 'Nuevo registro'}{editing && ` #${row[resource.id]}`}</h2>
    <form onSubmit={submit}>
      {deleting ? <p>Se eliminará el registro #{row[resource.id]} de {resource.titulo.toLowerCase()}. Confirma para continuar.</p> :
        <><p className="practice-help">Los campos marcados con * son obligatorios.</p>
          <fieldset disabled={busy} className="practice-fields"><legend className="sr-only">Datos del registro</legend>{resource.campos.map(field =>
            <FieldInput key={field.clave} field={field} value={values[field.clave]} edit={editing} change={value => setValues(previous => ({ ...previous, [field.clave]: value }))} />)}</fieldset></>}
      {error && <p role="alert" className="practice-error">{error}</p>}
      <div className="practice-actions"><button className={`practice-button ${deleting ? 'is-danger' : 'is-primary'}`} disabled={busy} type="submit">
        {deleting ? <Trash2 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}{busy ? 'Procesando…' : deleting ? 'Confirmar eliminación' : 'Guardar registro'}</button>
        <button className="practice-button" disabled={busy} onClick={cancel} type="button">Cancelar</button></div>
    </form>
  </section>
}
function Records({ resource }: { resource: Resource }) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [term, setTerm] = useState('')
  const [offset, setOffset] = useState(0)
  const [notice, setNotice] = useState('')
  const result = useQuery<Entries<Row>>(`/practica/registros/${resource.clave}?${new URLSearchParams({ q: term, offset: String(offset) })}`)
  function start(next: Editor) { setNotice(''); setEditor(next) }
  if (editor) return <RecordEditor resource={resource} editor={editor} cancel={() => setEditor(null)} finish={message => {
    if (editor.action === 'delete' && result.data?.filas.length === 1 && offset > 0) setOffset(0)
    setNotice(message); setEditor(null); result.refresh()
  }} />
  return <section className="practice-panel" aria-labelledby="practice-list-title">
    <div className="practice-panel-head"><h2 id="practice-list-title">{resource.titulo}</h2><button className="practice-button is-primary" onClick={() => start({ action: 'create' })}><Plus size={16} aria-hidden="true" />Nuevo registro</button></div>
    {resource.clave === 'usuarios' && <p className="practice-help">Estos registros pertenecen al modelo académico. Las cuentas de acceso se administran en Supabase Auth.</p>}
    <SearchBox label={`Buscar en ${resource.titulo.toLowerCase()}`} search={text => { setTerm(text); setOffset(0) }} />
    {notice && <p className="practice-success" role="status">{notice}</p>}
    {result.error ? <Status message={result.error} retry={result.refresh} /> : result.loading ? <Status message="Cargando registros…" /> : result.data && <>
      {result.data.filas.length ? <div className="practice-table-wrap" role="region" aria-label={`Registros de ${resource.titulo}`} tabIndex={0}>
        <table><thead><tr><th scope="col">Acciones</th>{resource.columnas.map(key => <th scope="col" key={key}>{labelFor(resource,key)}</th>)}</tr></thead>
          <tbody>{result.data.filas.map(row => <tr key={row[resource.id]}><td className="practice-row-actions"><button type="button" className="practice-text" aria-label={`Editar registro ${row[resource.id]}`} onClick={() => start({ action: 'edit', row })}>Editar</button><button type="button" className="practice-text is-danger-text" aria-label={`Eliminar registro ${row[resource.id]}`} onClick={() => start({ action: 'delete', row })}>Eliminar</button></td>{resource.columnas.map(key => <td key={key}>{display(resource,key,row[key])}</td>)}</tr>)}</tbody>
        </table></div> : <div className="practice-empty"><Search size={20} aria-hidden="true" /><p>{term ? 'No hay coincidencias con esta búsqueda.' : 'Todavía no hay registros.'}</p></div>}
      <Pager offset={offset} length={result.data.filas.length} total={result.data.total} change={setOffset} />
    </>}
  </section>
}

export function PracticePage() {
  const { recurso } = useParams()
  const resources = useQuery<{ recursos: Resource[] }>('/practica/recursos')
  const active = recurso ? resources.data?.recursos.find(r => r.clave === recurso) : resources.data?.recursos[0]
  return <div className="practice"><header className="practice-heading"><h1>Gestión de registros</h1><p>Administra los datos del entorno de práctica.</p></header>
    {resources.error ? <Status message={resources.error} retry={resources.refresh} /> : !resources.data ? <Status message="Cargando áreas de gestión…" /> : <>
      <nav aria-label="Áreas de gestión" className="practice-nav">{resources.data.recursos.map(r =>
        <Link key={r.clave} aria-current={active?.clave === r.clave ? 'page' : undefined} to={`/practica/${r.clave}`}>{r.titulo}</Link>
      )}<Link to="/practica/ventas">Ventas</Link></nav>
      {active ? <Records key={active.clave} resource={active} /> : <Status message="Esta área de gestión no está disponible." />}
    </>}
  </div>
}
