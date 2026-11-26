import { soles } from '@/shared/utils/format'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/icons'
import { Select } from '@/shared/ui/Select'
import type { Producto } from '@/shared/types'

export interface LineaProducto {
  id: string
  productoId: string
  cantidad: number
  /** Definido cuando la línea se escribe a mano: texto + importe, sin catálogo. */
  texto?: string
  importe?: number
}

const inputClass =
  'w-full min-w-0 rounded-lg border border-secondary bg-primary px-3 py-2.5 text-md text-primary shadow-xs placeholder:text-placeholder focus:ring-2 focus:ring-brand focus:outline-none'

interface LineasProductoProps {
  lineas: LineaProducto[]
  productos: Producto[]
  onChange: (lineas: LineaProducto[]) => void
  /** Muestra el importe calculado de cada línea. Útil en proformas y pedidos. */
  mostrarImporte?: boolean
  /** Permite escribir una línea libre además de elegirla del catálogo. */
  permitirTextoLibre?: boolean
}

export function LineasProducto({
  lineas,
  productos,
  onChange,
  mostrarImporte = false,
  permitirTextoLibre = false,
}: LineasProductoProps) {
  const agregar = () =>
    onChange([...lineas, { id: crypto.randomUUID(), productoId: '', cantidad: 1 }])

  const quitar = (id: string) => {
    if (lineas.length === 1) return
    onChange(lineas.filter((linea) => linea.id !== id))
  }

  const actualizar = (id: string, cambio: Partial<LineaProducto>) =>
    onChange(lineas.map((linea) => (linea.id === id ? { ...linea, ...cambio } : linea)))

  const alternarTexto = (linea: LineaProducto) => {
    if (linea.texto !== undefined) {
      actualizar(linea.id, { texto: undefined, importe: undefined, productoId: '', cantidad: 1 })
      return
    }
    actualizar(linea.id, { texto: '', importe: 0, productoId: '', cantidad: 1 })
  }

  return (
    <div className="space-y-3">
      {lineas.map((linea, indice) => {
        const producto = productos.find((item) => item.id === linea.productoId)
        const esTexto = linea.texto !== undefined
        const precio = producto?.precioUnitario ?? 0
        const importeLinea = esTexto ? (linea.importe ?? 0) : precio * linea.cantidad
        return (
          <div key={linea.id} className="grid min-w-0 gap-2 sm:grid-cols-12 sm:items-end">
            <div className="min-w-0 sm:col-span-6">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-tertiary">
                  {esTexto ? 'Texto' : 'Producto'} {indice + 1}
                </span>
                {permitirTextoLibre && (
                  <button
                    type="button"
                    onClick={() => alternarTexto(linea)}
                    className="text-xs font-medium text-brand-secondary hover:underline"
                  >
                    {esTexto ? 'Elegir del catálogo' : 'Escribir texto'}
                  </button>
                )}
              </div>

              {esTexto ? (
                <input
                  type="text"
                  value={linea.texto}
                  maxLength={300}
                  onChange={(evento) => actualizar(linea.id, { texto: evento.target.value })}
                  className={inputClass}
                  placeholder="Escribe el producto o servicio…"
                  aria-label={`Texto ${indice + 1}`}
                  required
                />
              ) : (
                <Select
                  ariaLabel={`Producto ${indice + 1}`}
                  value={linea.productoId}
                  onChange={(valor) => actualizar(linea.id, { productoId: valor })}
                  placeholder="Seleccionar…"
                  options={productos.map((item) => ({
                    value: item.id,
                    label: `${item.codigo} — ${item.descripcion}${mostrarImporte ? ` (${soles(item.precioUnitario)})` : ''}`,
                  }))}
                  isRequired
                />
              )}
            </div>

            {esTexto ? (
              <label className="block min-w-0 text-sm sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-tertiary">Importe (S/)</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={linea.importe ?? 0}
                  onChange={(evento) =>
                    actualizar(linea.id, { importe: Number(evento.target.value) })
                  }
                  className={inputClass}
                  required
                />
              </label>
            ) : (
              <label className="block min-w-0 text-sm sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-tertiary">Cantidad</span>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={linea.cantidad}
                  onChange={(evento) =>
                    actualizar(linea.id, { cantidad: Number(evento.target.value) })
                  }
                  className={inputClass}
                  required
                />
              </label>
            )}

            {mostrarImporte && (
              <div className="min-w-0 text-sm sm:col-span-3">
                <span className="mb-1 block text-xs font-medium text-tertiary">Importe</span>
                <p className="truncate py-2.5 font-medium text-primary">
                  {importeLinea > 0 ? soles(importeLinea) : '—'}
                </p>
              </div>
            )}

            <div className="sm:col-span-1">
              <Button
                variant="ghost"
                onClick={() => quitar(linea.id)}
                isDisabled={lineas.length === 1}
                aria-label={`Quitar ${esTexto ? 'texto' : 'producto'} ${indice + 1}`}
                startIcon={<Icon name="trash" className="size-4" />}
              />
            </div>
          </div>
        )
      })}

      <Button
        size="sm"
        variant="outline"
        onClick={agregar}
        startIcon={<Icon name="plus" className="size-4" />}
      >
        Agregar línea
      </Button>
    </div>
  )
}
