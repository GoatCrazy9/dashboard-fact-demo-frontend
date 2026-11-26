import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components'
import { GraficoArea, type PuntoVenta } from './GraficoArea'
import { Icon } from '@/shared/ui/icons'
import { cn } from '@/shared/utils/cn'

export interface Tendencia {
  positiva: boolean
  valor: number
}

interface AccionMetrica {
  etiqueta: string
  onAction: () => void
}

interface MetricCardProps {
  titulo: string
  valor: string
  puntos: PuntoVenta[]
  tendencia?: Tendencia | null
  comparacion?: string
  detalle?: string
  acciones?: AccionMetrica[]
  ariaLabel?: string
}

/** Tarjeta de métrica de Untitled UI: valor, tendencia, mini-gráfico y menú de acciones. */
export function MetricCard({
  titulo,
  valor,
  puntos,
  tendencia,
  comparacion = 'vs período anterior',
  detalle,
  acciones = [],
  ariaLabel,
}: MetricCardProps) {
  return (
    <div className="w-full min-w-0 max-w-lg">
      <div className="flex flex-col overflow-hidden rounded-xl bg-secondary shadow-xs ring-1 ring-secondary ring-inset">
        <div className="mb-0.5 px-4 pt-3 pb-2 md:px-5">
          <h3 className="text-sm font-semibold text-primary">{titulo}</h3>
        </div>
        <div className="relative flex flex-col gap-4 rounded-xl bg-primary px-4 py-5 shadow-xs ring-1 ring-secondary ring-inset md:gap-5 md:px-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <p className="text-display-sm font-semibold text-primary tabular-nums">{valor}</p>
              {tendencia ? (
                <div className="flex gap-2">
                  <span
                    className={cn(
                      'flex items-center gap-1',
                      tendencia.positiva ? 'text-success-primary' : 'text-error-primary',
                    )}
                  >
                    <Icon
                      name={tendencia.positiva ? 'arrow-up-right' : 'arrow-down-right'}
                      className="size-4 stroke-[3px]"
                    />
                    <span className="text-sm font-medium tabular-nums">
                      {tendencia.valor.toFixed(1)}%
                    </span>
                  </span>
                  <span className="text-sm font-medium text-tertiary">{comparacion}</span>
                </div>
              ) : (
                detalle && <p className="text-sm font-medium text-tertiary">{detalle}</p>
              )}
            </div>
          </div>

          <GraficoArea
            puntos={puntos}
            altura={56}
            className="text-fg-success-secondary"
            ariaLabel={ariaLabel ?? `Evolución de ${titulo.toLowerCase()}`}
          />

          {acciones.length > 0 && (
            <div className="absolute top-4 right-4 md:top-5 md:right-5">
              <MenuTrigger>
                <button
                  type="button"
                  aria-label={`Abrir menú de ${titulo.toLowerCase()}`}
                  className="cursor-pointer rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <Icon name="dots-vertical" className="size-5" />
                </button>
                <Popover
                  placement="bottom end"
                  className="z-30 min-w-44 rounded-lg bg-primary p-1 shadow-xl ring-1 ring-tertiary ring-inset outline-hidden"
                >
                  <Menu className="flex flex-col gap-0.5 outline-hidden">
                    {acciones.map((accion) => (
                      <MenuItem
                        key={accion.etiqueta}
                        onAction={accion.onAction}
                        className="flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-secondary outline-hidden transition-colors data-[hover]:bg-secondary data-[pressed]:bg-secondary data-[focus-visible]:ring-2 data-[focus-visible]:ring-brand"
                      >
                        {accion.etiqueta}
                      </MenuItem>
                    ))}
                  </Menu>
                </Popover>
              </MenuTrigger>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
