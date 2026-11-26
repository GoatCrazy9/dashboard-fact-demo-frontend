import { Skeleton } from '@/shared/ui/Skeleton'

export interface SerieRadial {
  etiqueta: string
  valor: number
  formato: (valor: number) => string
}

const RADIOS = [84, 72, 60]
const TONOS = ['opacity-100', 'opacity-75', 'opacity-50']

/** Barras radiales concéntricas en SVG puro, con el estilo del ejemplo de Untitled UI. */
export function GraficoRadial({
  titulo,
  series,
  etiquetaCentro,
  valorCentro,
}: {
  titulo: string
  series: SerieRadial[]
  etiquetaCentro: string
  valorCentro: string
}) {
  const maximo = Math.max(...series.map((serie) => serie.valor), 1)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <svg
        viewBox="0 0 320 220"
        className="h-55 w-full font-medium text-tertiary"
        role="img"
        aria-label={`${titulo}: ${series.map((serie) => `${serie.etiqueta.toLowerCase()} ${serie.formato(serie.valor)}`).join(', ')}`}
      >
        <g className="text-utility-neutral-100">
          {RADIOS.map((radio) => (
            <circle
              key={radio}
              cx="160"
              cy="102"
              r={radio}
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
            />
          ))}
        </g>
        <g transform="rotate(-90 160 102)">
          {series.map((serie, indice) => {
            const porcentaje = Math.min(100, (serie.valor / maximo) * 100)
            return (
              <circle
                key={serie.etiqueta}
                className={`text-fg-success-secondary ${TONOS[indice]}`}
                cx="160"
                cy="102"
                r={RADIOS[indice]}
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                strokeLinecap={porcentaje < 1 ? 'butt' : 'round'}
                pathLength={100}
                strokeDasharray={`${porcentaje} 100`}
              >
                <title>{`${serie.etiqueta}: ${serie.formato(serie.valor)}`}</title>
              </circle>
            )
          })}
        </g>
        <text
          x="50%"
          y="94"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-current text-xs font-medium"
        >
          {etiquetaCentro}
        </text>
        <text
          x="50%"
          y="118"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-current text-lg font-semibold text-primary tabular-nums"
        >
          {valorCentro}
        </text>
      </svg>

      <ul className="flex flex-row flex-wrap justify-center gap-x-4 gap-y-2">
        {series.map((serie, indice) => (
          <li key={serie.etiqueta} className="flex items-center gap-2 text-sm text-tertiary">
            <span
              className={`block size-2 rounded-full bg-current ring-[0.5px] ring-black/10 ring-inset text-fg-success-secondary ${TONOS[indice]}`}
              aria-hidden="true"
            />
            <span>{serie.etiqueta}</span>
            <span className="font-semibold text-primary tabular-nums">
              {serie.formato(serie.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Silueta equivalente al gráfico radial mientras cargan los datos del panel. */
export function GraficoRadialSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="flex h-55 w-full items-center justify-center">
        <div className="relative size-44">
          <Skeleton className="absolute inset-0 rounded-full" />
          <Skeleton className="absolute inset-[8%] rounded-full bg-primary" />
          <Skeleton className="absolute inset-[16%] rounded-full bg-primary" />
          <Skeleton className="absolute inset-[24%] rounded-full bg-primary" />
          <Skeleton className="absolute inset-[33%] rounded-full" />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {[0, 1, 2].map((serie) => (
          <Skeleton key={serie} className="h-3 w-32" />
        ))}
      </div>
    </div>
  )
}
