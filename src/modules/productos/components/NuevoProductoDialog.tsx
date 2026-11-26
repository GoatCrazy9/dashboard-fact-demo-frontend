import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { soles } from '@/shared/utils/format'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Icon } from '@/shared/ui/icons'
import { TextField } from '@/shared/ui/TextField'
import type { Producto } from '@/shared/types'
import { productosService } from '../service/productosService'

interface NuevoProductoDialogProps {
  open: boolean
  onClose: () => void
  onCreado: (producto: Producto) => void
}

/** Encabezado numerado para dar ritmo al formulario sin depender de iconos decorativos. */
function TituloSeccion({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-brand-secondary ring-1 ring-brand ring-inset">
        {numero}
      </span>
      {titulo}
    </h3>
  )
}

export function NuevoProductoDialog({ open, onClose, onCreado }: NuevoProductoDialogProps) {
  const [codigo, setCodigo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [unidad, setUnidad] = useState('NIU')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('0')
  const [afectoIgv, setAfectoIgv] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const alEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onClose()
    }
    const desbordamiento = document.body.style.overflow
    document.addEventListener('keydown', alEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alEscape)
      document.body.style.overflow = desbordamiento
    }
  }, [open, onClose])

  if (!open) return null

  const precioVista = Number(precio.replace(',', '.'))
  const stockVista = Number(stock)
  const precioMostrado = Number.isFinite(precioVista) && precioVista > 0 ? precioVista : 0
  const stockMostrado = Number.isInteger(stockVista) && stockVista >= 0 ? stockVista : 0

  function limpiar() {
    setCodigo('')
    setDescripcion('')
    setUnidad('NIU')
    setPrecio('')
    setStock('0')
    setAfectoIgv(true)
    setError(null)
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    const precioNumero = Number(precio.replace(',', '.'))
    const stockNumero = Number(stock)

    if (!codigo.trim()) return setError('Escribe el código del producto.')
    if (descripcion.trim().length < 2) return setError('La descripción necesita al menos 2 caracteres.')
    if (!unidad.trim()) return setError('Indica la unidad de medida.')
    if (!Number.isFinite(precioNumero) || precioNumero <= 0) {
      return setError('El precio unitario debe ser mayor a cero.')
    }
    if (!Number.isInteger(stockNumero) || stockNumero < 0) {
      return setError('El stock debe ser un número entero positivo.')
    }

    setGuardando(true)
    try {
      const creado = await productosService.crear({
        codigo: codigo.trim(),
        descripcion: descripcion.trim(),
        unidad: unidad.trim().toUpperCase(),
        precioUnitario: precioNumero,
        afectoIgv,
        stock: stockNumero,
      })
      limpiar()
      onCreado(creado)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el producto.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !guardando) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nuevo-producto"
        className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-primary shadow-2xl ring-1 ring-tertiary ring-inset sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-secondary px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-brand-secondary ring-1 ring-brand ring-inset">
              <Icon name="package" className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="titulo-nuevo-producto" className="text-display-xs font-semibold text-primary">
                  Nuevo producto
                </h2>
                <Badge tone="brand">Catálogo</Badge>
              </div>
              <p className="mt-1 text-sm text-tertiary">
                Estará disponible al emitir boletas y facturas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-tertiary transition hover:bg-primary_hover hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Icon name="close" className="size-5" />
          </button>
        </header>

        <form onSubmit={(evento) => void handleSubmit(evento)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {error && (
              <div className="mb-5">
                <Alert tone="error" title="Revisa los datos">
                  {error}
                </Alert>
              </div>
            )}

            <div className="flex flex-col gap-6">
              <section>
                <TituloSeccion numero="01" titulo="Identificación" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="Código"
                    requiredMark
                    value={codigo}
                    onChange={setCodigo}
                    placeholder="Ej. MUE-001"
                    maxLength={40}
                    inputClassName="text-md"
                    hint="Identificador único del catálogo."
                    startAdornment={<Icon name="tag" className="size-4" />}
                    autoFocus
                  />
                  <TextField
                    label="Unidad"
                    requiredMark
                    value={unidad}
                    onChange={setUnidad}
                    placeholder="NIU"
                    maxLength={10}
                    inputClassName="text-md"
                    hint="Ej. NIU, SERV, KG."
                  />
                  <TextField
                    label="Descripción"
                    requiredMark
                    value={descripcion}
                    onChange={setDescripcion}
                    placeholder="Ej. Mesa de madera 1.20 m"
                    maxLength={300}
                    inputClassName="text-md"
                    hint="Nombre que aparecerá en el comprobante."
                    className="sm:col-span-2"
                  />
                </div>
              </section>

              <section>
                <TituloSeccion numero="02" titulo="Precio e inventario" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="Precio unitario"
                    requiredMark
                    type="number"
                    value={precio}
                    onChange={setPrecio}
                    placeholder="0.00"
                    inputClassName="text-md"
                    hint="Precio final con IGV incluido."
                    startAdornment={<span className="text-sm font-medium text-secondary">S/</span>}
                  />
                  <TextField
                    label="Stock inicial"
                    type="number"
                    value={stock}
                    onChange={setStock}
                    placeholder="0"
                    inputClassName="text-md"
                    hint="Unidades disponibles al crear."
                  />
                  <div className="rounded-xl bg-secondary p-3.5 ring-1 ring-tertiary ring-inset sm:col-span-2">
                    <Checkbox
                      size="md"
                      label="Afecto a IGV"
                      hint="Desmarca si el producto está exonerado."
                      isSelected={afectoIgv}
                      onChange={setAfectoIgv}
                    />
                  </div>
                </div>
              </section>

              <section
                aria-label="Vista previa del producto"
                className="rounded-xl bg-secondary p-4 ring-1 ring-tertiary ring-inset"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold tracking-wide text-tertiary uppercase">Vista previa</p>
                  <Badge tone={afectoIgv ? 'brand' : 'gray'}>
                    {afectoIgv ? 'Afecto a IGV' : 'Exonerado'}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-3 border-b border-tertiary pb-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-brand-secondary ring-1 ring-brand ring-inset">
                    <Icon name="tag" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">
                      {descripcion.trim() || 'Nombre del producto'}
                    </p>
                    <p className="truncate text-xs text-tertiary">
                      {codigo.trim() || 'SIN-CÓDIGO'} · {unidad.trim().toUpperCase() || 'NIU'}
                    </p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-tertiary">Precio</dt>
                    <dd className="text-sm font-semibold text-primary tabular-nums">
                      {soles(precioMostrado)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tertiary">Stock inicial</dt>
                    <dd className="text-sm font-semibold text-primary tabular-nums">
                      {stockMostrado} {unidad.trim().toUpperCase() || 'NIU'}
                    </dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="text-xs text-tertiary">Estado</dt>
                    <dd className="text-sm font-medium text-secondary">Disponible al guardar</dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>

          <footer className="shrink-0 border-t border-secondary bg-primary px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                isDisabled={guardando}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={guardando}
                startIcon={<Icon name="plus" className="size-4" />}
                className="w-full sm:w-auto"
              >
                Guardar producto
              </Button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
