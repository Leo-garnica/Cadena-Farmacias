import { useEffect, useRef } from 'react'
import { Form, Link, useNavigation, useSubmit } from 'react-router'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { Categoria } from '@vitafarma/contracts/inventory'
import { Button } from '../../../shared/ui/Button'
import { inventoryHref, orders, statuses } from '../application/query'
import type { InventoryQuery } from '../domain/types'

export function InventoryFilters({ query, categories }: { query: InventoryQuery; categories: Categoria[] }) {
  const submit = useSubmit()
  const navigation = useNavigation()
  const inputRef = useRef<HTMLInputElement>(null)
  // Synchronize the native input with URL history without per-keystroke routing.
  useEffect(() => { if (inputRef.current) inputRef.current.value = query.q }, [query.q])
  const count = Number(Boolean(query.q)) + Number(query.categoria !== null) + Number(query.estado !== 'todos')
  return <Form role="search" aria-label="Filtros de inventario" method="get" action="/inventario" className="inventory-filters">
    <input type="hidden" name="farmacia" value={query.farmacia} /><input type="hidden" name="pagina" value="1" />
    <div className="filter-search"><label htmlFor="product-search">Buscar producto</label><div className="search-field"><Search size={18} aria-hidden="true" /><input id="product-search" ref={inputRef} type="search" name="q" defaultValue={query.q} placeholder="Nombre o código, p. ej. 1001…" maxLength={100} autoComplete="off" spellCheck={false} /><Button type="submit" disabled={navigation.state !== 'idle'}>Buscar</Button></div></div>
    <div className="filter-category"><label htmlFor="category-filter">Categoría</label><select id="category-filter" name="categoria" value={query.categoria ?? ''} onChange={(event) => void submit(event.currentTarget.form)}><option value="">Todas las categorías</option>{categories.map((category) => <option key={category.id_categoria} value={category.id_categoria}>{category.nombre ?? 'No registrado'}</option>)}</select></div>
    <div className="filter-state"><label htmlFor="status-filter">Estado</label><select id="status-filter" name="estado" value={query.estado} onChange={(event) => void submit(event.currentTarget.form)}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div>
    <div className="filters-secondary"><div className="filters-context"><SlidersHorizontal size={15} aria-hidden="true" /><span>{count ? `${count} ${count === 1 ? 'filtro activo' : 'filtros activos'}` : 'Todos los productos de la sucursal'}</span>{count > 0 ? <Link className="clear-filters" to={inventoryHref({ ...query, q: '', categoria: null, estado: 'todos', pagina: 1 })}><X size={13} aria-hidden="true" />Limpiar filtros</Link> : null}</div><div className="sort-control"><label htmlFor="order-select">Ordenar por</label><select id="order-select" name="orden" value={query.orden} onChange={(event) => void submit(event.currentTarget.form)}>{orders.map((order) => <option key={order.value} value={order.value}>{order.label}</option>)}</select></div></div>
  </Form>
}
