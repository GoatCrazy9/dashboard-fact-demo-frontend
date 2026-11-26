import { Skeleton } from '@/shared/ui/Skeleton'

export interface SegmentoDona {
  etiqueta: string
  valor: number
  formato: (valor: number) => string
}

const TONOS = ['opacity-100', 'opacity-75', 'opacity-50']

/** Dona en SVG puro con leyenda vertical a la derecha, sin Recharts. */
export function GraficoDona({
  titulo,
  segmentos,
}: {
  titulo: string
  segmentos: SegmentoDona[]
}) {
  const total = segmentos.reduce((suma, segmento) => suma + segmento.valor, 0)
  let acumulado = 0

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-2">
      <svg
        viewBox="-8 -8 176 176"
        className="size-40 shrink-0"
        role="img"
        aria-label={`${titulo}: ${segmentos.map((segmento) => `${segmento.etiqueta.toLowerCase()} ${segmento.formato(segmento.valor)}`).join(', ')}`}
      >
        <circle cx="80" cy="80" r="60" fill="none" stroke="currentColor" strokeWidth="40" className="text-utility-neutral-100" />
        <g transform="rotate(-90 80 80)" fill="none" strokeWidth="40">
          {segmentos.map((segmento, indice) => {
            const porcentaje = total ? (segmento.valor / total) * 100 : 0
            const desplazamiento = acumulado
            acumulado += porcentaje
            if (porcentaje <= 0) return null
            return (
              <circle
                key={segmento.etiqueta}
                cx="80"
                cy="80"
                r="60"
                stroke="currentColor"
                pathLength={100}
                strokeDasharray={`${porcentaje} ${100 - porcentaje}`}
                strokeDashoffset={-desplazamiento}
                className={`text-fg-success-secondary ${TONOS[indice]}`}
              >
                <title>{`${segmento.etiqueta}: ${segmento.formato(segmento.valor)}`}</title>
              </circle>
            )
          })}
        </g>
      </svg>

      <ul className="flex w-full min-w-0 flex-col gap-1 items-start lg:absolute lg:top-1/2 lg:left-[calc(50%+5.5rem)] lg:w-32 lg:-translate-y-1/2">
        {segmentos.map((segmento, indice) => (
          <li key={segmento.etiqueta} className="flex w-full min-w-0 items-center gap-2 text-sm text-tertiary">
            <span
              className={`block size-2 shrink-0 rounded-full bg-current ring-[0.5px] ring-black/10 ring-inset text-fg-success-secondary ${TONOS[indice]}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate">{segmento.etiqueta}</span>
            <span className="shrink-0 font-semibold text-primary tabular-nums">
              {segmento.formato(segmento.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Silueta equivalente a la dona mientras cargan los datos del panel. */
export function GraficoDonaSkeleton() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-2">
      <Skeleton className="size-36 shrink-0 rounded-full" />
      <div className="flex w-full min-w-0 flex-col gap-1 lg:absolute lg:top-1/2 lg:left-[calc(50%+5.5rem)] lg:w-32 lg:-translate-y-1/2">
        {[0, 1, 2].map((segmento) => (
          <div key={segmento} className="flex items-center gap-2">
            <Skeleton className="size-2 shrink-0 rounded-full" />
            <Skeleton className="h-3 w-full max-w-28" />
            <Skeleton className="h-3 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
