import { Link, useRevalidator, useRouteError, isRouteErrorResponse } from 'react-router'
import { AsyncState } from '../shared/ui/AsyncState'
import { Button } from '../shared/ui/Button'
import { SessionControls } from '../modules/access/public'

export function NotFound() {
  return <AsyncState kind="not-found" title="Esta página no está disponible" description="Revisa la dirección o vuelve a la consulta de inventario." action={<Link className="button button--primary" to="/inventario">Ir a Inventario</Link>} />
}
export function InventoryError() {
  const error = useRouteError()
  const revalidator = useRevalidator()
  const status = isRouteErrorResponse(error) ? error.status : 0
  if (status === 401 || status === 403) {
    return <AsyncState kind="error" title={status === 401 ? 'Tu sesión ya no es válida' : 'Acceso restringido'}
      description={status === 401 ? 'Vuelve a iniciar sesión para consultar tus sucursales.' : 'Tu cuenta no tiene permiso para esta consulta. Puedes salir y entrar con otra cuenta.'}
      action={<SessionControls />} />
  }
  return <AsyncState kind="error" title="No pudimos cargar el inventario" description="Vuelve a intentarlo para recuperar la consulta con los mismos filtros." action={<Button onClick={() => void revalidator.revalidate()} disabled={revalidator.state === 'loading'}>{revalidator.state === 'loading' ? 'Reintentando…' : 'Reintentar'}</Button>} />
}
export function InitialLoading() {
  return <div className="initial-loading"><span translate="no">VitaFarma.</span><AsyncState kind="loading" title="Preparando el inventario…" description="Consultando las sucursales disponibles." /></div>
}
