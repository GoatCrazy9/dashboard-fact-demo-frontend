import { useId } from 'react'
import { cn } from '@/shared/utils/cn'

export interface PuntoVenta {
  etiqueta: string
  total: number
  cantidad: number
}

type Coordenada = readonly [number, number]

const formatear = (valor: number) => valor.toFixed(2)
const limitar = (valor: number) => Math.min(100, Math.max(0, valor))

/** Curva de Catmull-Rom convertida a Bézier cúbica, sin depender de Recharts. */
function rutaCurva(coordenadas: Coordenada[]): string {
  if (!coordenadas.length) return ''
  const [primera] = coordenadas
  let ruta = `M${formatear(primera[0])},${formatear(primera[1])}`
  if (coordenadas.length === 1) {
    return `${ruta} L${formatear(primera[0])},${formatear(primera[1])}`
  }

  for (let indice = 0; indice < coordenadas.length - 1; indice += 1) {
    const anterior = coordenadas[Math.max(0, indice - 1)]
    const actual = coordenadas[indice]
    const siguiente = coordenadas[indice + 1]
    const posterior = coordenadas[Math.min(coordenadas.length - 1, indice + 2)]

    const c1x = limitar(actual[0] + (siguiente[0] - anterior[0]) / 6)
    const c1y = limitar(actual[1] + (siguiente[1] - anterior[1]) / 6)
    const c2x = limitar(siguiente[0] - (posterior[0] - actual[0]) / 6)
    const c2y = limitar(siguiente[1] - (posterior[1] - actual[1]) / 6)

    ruta += ` C${formatear(c1x)},${formatear(c1y)} ${formatear(c2x)},${formatear(c2y)} ${formatear(siguiente[0])},${formatear(siguiente[1])}`
  }

  return ruta
}

/** Gráfico de área en SVG puro: línea curva tipo Untitled UI sin añadir dependencias. */
export function GraficoArea({
  puntos,
  altura = 56,
  rejilla = false,
  className,
  ariaLabel = 'Evolución de ventas del período seleccionado',
}: {
  puntos: PuntoVenta[]
  altura?: number
  rejilla?: boolean
  className?: string
  ariaLabel?: string
}) {
  const idGradiente = `area-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const valores = puntos.length ? puntos.map((punto) => punto.total) : [0, 0]
  const maximo = Math.max(...valores, 1)
  const minimo = Math.min(...valores, 0)
  const amplitud = maximo - minimo || 1
  const coordenadas = valores.map((valor, indice) => {
    const x = valores.length === 1 ? 0 : (indice / (valores.length - 1)) * 100
    const y = 94 - ((valor - minimo) / amplitud) * 86
    return [x, y] as const
  })
  const linea = rutaCurva(coordenadas)
  const area = `${linea} L100,100 L0,100 Z`

  return (
    <div className="relative w-full" style={{ height: altura }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={cn('size-full overflow-visible', className)}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="95%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {rejilla && (
          <g stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" vectorEffect="non-scaling-stroke">
            {[8, 29.5, 51, 72.5, 94].map((y) => (
              <line key={y} x1="0" x2="100" y1={y} y2={y} />
            ))}
          </g>
        )}
        <path d={area} fill={`url(#${idGradiente})`} stroke="none" />
        <path
          d={linea}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
