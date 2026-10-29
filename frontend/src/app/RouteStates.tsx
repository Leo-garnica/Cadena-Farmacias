import { Link, useLocation, useNavigate, useRevalidator, useRouteError, isRouteErrorResponse } from 'react-router'
import { AsyncState } from '../shared/ui/AsyncState'
import { Button } from '../shared/ui/Button'

export function NotFound() {
  return <AsyncState kind="not-found" title="Esta página no está disponible" description="Revisa la dirección o vuelve a la consulta de inventario." action={<Link className="button button--primary" to="/inventario">Ir a Inventario</Link>} />
}
export function InventoryError() {
  const error = useRouteError()
  const location = useLocation()
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const recover = () => {
    const params = new URLSearchParams(location.search)
    if (params.has('demo')) {
      params.delete('demo')
      void navigate(`${location.pathname}?${params}`, { replace: true, state: location.state })
    } else void revalidator.revalidate()
  }
  return <AsyncState kind="error" title="No pudimos cargar el inventario" description={isRouteErrorResponse(error) && error.status === 503 ? 'La consulta de demostración no está disponible en este momento. Puedes volver a intentarlo conservando tus filtros.' : 'Ocurrió un problema al consultar los datos. Vuelve a intentarlo.'} action={<Button onClick={recover} disabled={revalidator.state === 'loading'}>{revalidator.state === 'loading' ? 'Reintentando…' : 'Reintentar'}</Button>} />
}
export function InitialLoading() {
  return <div className="initial-loading"><span translate="no">VitaFarma.</span><AsyncState kind="loading" title="Preparando el inventario…" description="Cargando los datos simulados de las sucursales." /></div>
}
