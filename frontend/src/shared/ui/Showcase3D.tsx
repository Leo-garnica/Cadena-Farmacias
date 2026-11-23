import { memo, useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { Move3d } from 'lucide-react'
import './showcase-3d.css'

export interface ShowcaseItem {
  id: string
  src: string
  label: string
  eyebrow: string
  title: string
  meta?: string
  price?: string
  status?: string
}

const defaultShowcaseItems: readonly ShowcaseItem[] = [
  {
    id: 'frasco',
    src: '/images/hero-3d/frasco-tabletas.webp',
    label: 'Analgésicos',
    eyebrow: 'BOTIQUÍN DIARIO',
    title: 'Tabletas y frascos',
    meta: 'Stock real en sucursal',
  },
  {
    id: 'capsulas',
    src: '/images/hero-3d/capsulas-3d.webp',
    label: 'Cápsulas',
    eyebrow: 'FÓRMULAS CLÍNICAS',
    title: 'Cápsulas de precisión',
    meta: 'Retiro o entrega local',
  },
  {
    id: 'pro',
    src: '/images/hero-3d/capsulas-pro.webp',
    label: 'Liberación pro',
    eyebrow: 'TRATAMIENTO',
    title: 'Liberación controlada',
    meta: 'Control por lote vigente',
  },
  {
    id: 'gel',
    src: '/images/hero-3d/capsulas-gel.webp',
    label: 'Suplementos',
    eyebrow: 'BIENESTAR',
    title: 'Cápsulas blandas',
    meta: 'Precios actualizados',
  },
]

interface Showcase3DProps {
  items?: readonly ShowcaseItem[]
  variant?: 'hero' | 'ambient'
  hint?: string
  ariaLabel?: string
  onSelectItem?: (item: ShowcaseItem) => void
}

export const Showcase3D = memo(function Showcase3D({
  items = defaultShowcaseItems,
  variant = 'hero',
  hint = 'Mueve el cursor para explorar en 3D',
  ariaLabel = 'Vitrina 3D interactiva de medicamentos',
  onSelectItem,
}: Showcase3DProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [tilted, setTilted] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = media.matches
    const onChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches
      if (event.matches && stageRef.current) {
        stageRef.current.style.setProperty('--rx', '0deg')
        stageRef.current.style.setProperty('--ry', '0deg')
        stageRef.current.style.setProperty('--tx', '0px')
        stageRef.current.style.setProperty('--ty', '0px')
        setTilted(false)
      }
    }
    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const applyTilt = useCallback((rx: number, ry: number, gx: number, gy: number, tx: number, ty: number) => {
    const node = stageRef.current
    if (!node) return
    node.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
    node.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
    node.style.setProperty('--gx', `${gx.toFixed(1)}%`)
    node.style.setProperty('--gy', `${gy.toFixed(1)}%`)
    node.style.setProperty('--tx', `${tx.toFixed(1)}px`)
    node.style.setProperty('--ty', `${ty.toFixed(1)}px`)
  }, [])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotionRef.current) return
    const node = stageRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const nx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1))
    const ny = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1))
    const maxAngle = variant === 'ambient' ? 12 : 16
    const rx = -ny * maxAngle
    const ry = nx * maxAngle
    const gx = ((nx + 1) / 2) * 100
    const gy = ((ny + 1) / 2) * 100
    const tx = nx * (variant === 'ambient' ? 10 : 14)
    const ty = ny * (variant === 'ambient' ? 8 : 11)
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      applyTilt(rx, ry, gx, gy, tx, ty)
      setTilted(true)
    })
  }, [applyTilt, variant])

  const handlePointerLeave = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    applyTilt(0, 0, 50, 38, 0, 0)
    setTilted(false)
  }, [applyTilt])

  const safeIndex = activeIndex < items.length ? activeIndex : 0
  const current = items[safeIndex] ?? defaultShowcaseItems[0]

  return (
    <div
      className={`vf-stage3d vf-stage3d--${variant}`}
      data-tilt-active={tilted ? 'true' : 'false'}
      aria-label={ariaLabel}
    >
      <div
        ref={stageRef}
        className="vf-stage3d-viewport"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="vf-stage3d-sheen" aria-hidden="true" />
        <div className="vf-stage3d-scene">
          <div className="vf-stage3d-ring vf-stage3d-ring--outer" aria-hidden="true" />
          <div className="vf-stage3d-ring vf-stage3d-ring--inner" aria-hidden="true" />
          <div className="vf-stage3d-pedestal" aria-hidden="true" />
          <div className="vf-stage3d-object">
            <img
              key={current.id}
              src={current.src}
              alt=""
              width={640}
              height={520}
              decoding="async"
              fetchPriority="high"
            />
          </div>
          {variant === 'hero' && (
            <div className="vf-stage3d-badge">
              <span className="vf-stage3d-eyebrow">{current.eyebrow}</span>
              <strong>{current.title}</strong>
              {(current.price || current.meta) && (
                <div className="vf-stage3d-meta">
                  {current.price && <span className="vf-stage3d-price">{current.price}</span>}
                  {current.meta && <span>{current.meta}</span>}
                </div>
              )}
            </div>
          )}
        </div>
        {variant === 'hero' && (
          <div className="vf-stage3d-hint" aria-hidden="true">
            <Move3d size={14} />
            <span>{hint}</span>
          </div>
        )}
      </div>

      {items.length > 1 && (
        <div className="vf-stage3d-tabs" role="group" aria-label="Cambiar medicamento en vitrina 3D">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              className="vf-stage3d-tab"
              aria-pressed={idx === safeIndex}
              onClick={() => {
                setActiveIndex(idx)
                onSelectItem?.(item)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
