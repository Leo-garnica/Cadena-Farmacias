import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowDown, ArrowRight, ArrowUp, Boxes, CalendarDays, MapPin, PackageSearch, ShoppingBag, Truck } from 'lucide-react'
import { Showcase3D } from '../../shared/ui/Showcase3D'
import './landing.css'

const topics = [
  { Icon: PackageSearch, title: 'Productos', detail: 'Busca por nombre o código y consulta la categoría de cada producto.' },
  { Icon: Boxes, title: 'Existencias', detail: 'Revisa las cantidades registradas en la sucursal que elijas.' },
  { Icon: CalendarDays, title: 'Lotes', detail: 'Consulta el lote asociado y su fecha de vencimiento cuando estén disponibles.' },
]

const shopTopics = [
  { Icon: MapPin, title: 'Elige una sucursal', detail: 'Consulta precios y disponibilidad antes de preparar tu carrito.' },
  { Icon: ShoppingBag, title: 'Retira tu pedido', detail: 'Revisa el estado y dirígete a la farmacia cuando esté listo.' },
  { Icon: Truck, title: 'Recibe tu compra', detail: 'Las zonas habilitadas muestran el costo de entrega antes del pago.' },
]

export function LandingPage({ brand, loginPath, commerce = false }: { brand: ReactNode; loginPath: string; commerce?: boolean }) {
  useEffect(() => { document.title = 'VitaFarma · Mostrador' }, [])
  const staffLogin = loginPath + '?siguiente=%2Foperaciones'

  return <div className="mostrador" id="inicio">
    <a className="skip-link" href="#presentacion">Saltar al contenido</a>
    <header className="mostrador-header">
      <div className="mostrador-frame mostrador-masthead">
        {brand}
        {commerce ? <nav aria-label="Accesos de VitaFarma" className="mostrador-access">
          <Link to="/tienda/entrar">Mi cuenta</Link>
          <Link to={staffLogin}>Iniciar sesión <span className="mostrador-staff-label"> · Personal</span></Link>
          <Link to="/equipo/solicitar" className="mostrador-request">Solicitar ingreso</Link>
        </nav> : <nav aria-label="Portada"><a href="#consultas">Qué puedes consultar <ArrowDown size={15} aria-hidden="true" /></a></nav>}
      </div>
    </header>
    <main id="presentacion" tabIndex={-1}>
      <section className="mostrador-hero-band">
        <div className="mostrador-frame mostrador-hero">
          <div className="mostrador-intro">
            <span className="mostrador-eyebrow">{commerce ? 'FARMACIA VITAFARMA' : 'SISTEMA DE MOSTRADOR'}</span>
            <h1>{commerce ? 'Tu farmacia, más cerca.' : 'El inventario, desde el mostrador.'}</h1>
            <p>{commerce ? 'Encuentra productos en tu sucursal, pide para retirar o consulta si puedes recibir tu compra en casa.' : 'Un espacio para el equipo de farmacia. Encuentra productos y revisa sus existencias y lotes por sucursal.'}</p>
            <Link className="mostrador-enter" to={commerce ? '/tienda' : loginPath}>
              {commerce ? 'Explorar la tienda' : 'Acceso del personal'} <ArrowRight size={20} aria-hidden="true" />
            </Link>
          </div>
          <div className="mostrador-photo">
            <Showcase3D variant="hero" />
          </div>
        </div>
      </section>
      <section className="mostrador-guide" aria-labelledby="consultas">
        <div className="mostrador-frame mostrador-guide-layout">
          <div className="mostrador-guide-intro">
            <h2 id="consultas" tabIndex={-1}>{commerce ? 'Cómo comprar' : 'Qué puedes consultar'}</h2>
            <p>{commerce ? 'Puedes recorrer el catálogo sin iniciar sesión. Elige cómo recibir tu pedido antes de confirmar.' : 'Ingresa con tu cuenta de personal y selecciona la sucursal que necesitas revisar.'}</p>
          </div>
          <dl className="mostrador-topics">
            {(commerce ? shopTopics : topics).map(({ Icon, title, detail }) => <div className="mostrador-topic" key={title}>
              <dt><span className="mostrador-topic-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.7} /></span>{title}</dt>
              <dd>{detail}</dd>
            </div>)}
          </dl>
        </div>
      </section>
    </main>
    <footer className="mostrador-footer-band"><div className="mostrador-frame mostrador-footer"><span>VitaFarma</span><a href="#inicio">Volver al inicio <ArrowUp size={14} aria-hidden="true" /></a></div></footer>
  </div>
}
