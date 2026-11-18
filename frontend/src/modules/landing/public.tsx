import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowDown, ArrowRight, ArrowUp, Boxes, CalendarDays, PackageSearch } from 'lucide-react'
import './landing.css'

const topics = [
  { Icon: PackageSearch, title: 'Productos', detail: 'Busca por nombre o código y consulta la categoría de cada producto.' },
  { Icon: Boxes, title: 'Existencias', detail: 'Revisa las cantidades registradas en la sucursal que elijas.' },
  { Icon: CalendarDays, title: 'Lotes', detail: 'Consulta el lote asociado y su fecha de vencimiento cuando estén disponibles.' },
]

export function LandingPage({ brand, loginPath }: { brand: ReactNode; loginPath: string }) {
  useEffect(() => { document.title = 'VitaFarma · Mostrador' }, [])

  return <div className="mostrador" id="inicio">
    <a className="skip-link" href="#presentacion">Saltar al contenido</a>
    <header className="mostrador-header">
      <div className="mostrador-frame mostrador-masthead">
        {brand}
        <nav aria-label="Portada"><a href="#consultas">Qué puedes consultar <ArrowDown size={15} aria-hidden="true" /></a></nav>
      </div>
    </header>
    <main id="presentacion" tabIndex={-1}>
      <div className="mostrador-frame mostrador-hero">
        <div className="mostrador-intro">
          <h1>El inventario, desde el mostrador.</h1>
          <p>Un espacio para el equipo de farmacia. Encuentra productos y revisa sus existencias y lotes por sucursal.</p>
          <Link className="mostrador-enter" to={loginPath}>Acceso del personal <ArrowRight size={20} aria-hidden="true" /></Link>
        </div>
        <div className="mostrador-photo">
          <img src="/images/mostrador.jpg" alt="" fetchPriority="high" width="1200" height="900" />
        </div>
      </div>
      <section className="mostrador-guide" aria-labelledby="consultas">
        <div className="mostrador-frame mostrador-guide-layout">
          <div className="mostrador-guide-intro">
            <h2 id="consultas" tabIndex={-1}>Qué puedes consultar</h2>
            <p>Ingresa con tu cuenta de personal y selecciona la sucursal que necesitas revisar.</p>
          </div>
          <dl className="mostrador-topics">
            {topics.map(({ Icon, title, detail }) => <div className="mostrador-topic" key={title}>
              <dt><Icon size={23} strokeWidth={1.6} aria-hidden="true" />{title}</dt>
              <dd>{detail}</dd>
            </div>)}
          </dl>
        </div>
      </section>
    </main>
    <footer className="mostrador-frame mostrador-footer"><span>VitaFarma</span><a href="#inicio">Volver al inicio <ArrowUp size={14} aria-hidden="true" /></a></footer>
  </div>
}
