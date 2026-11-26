import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { MovimientosSkeleton } from '@/shared/ui/PaginasSkeleton'
import { cn } from '@/shared/utils/cn'
import { Alert } from '@/shared/ui/Alert'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Icon, type IconName } from '@/shared/ui/icons'
import { TextField } from '@/shared/ui/TextField'
import type { MovimientoStock, Producto } from '@/shared/types'
import { productosService } from '../service/productosService'

function ModalShell({
  open,
  onClose,
  titleId,
  title,
  description,
  icono,
  badge,
  children,
}: {
  open: boolean
  onClose: () => void
  titleId: string
  title: string
  description: string
  icono?: IconName
  badge?: string
  children: ReactNode
}) {
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-primary p-5 shadow-2xl ring-1 ring-tertiary ring-inset sm:rounded-2xl sm:p-6"
      >
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {icono && (
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-brand-secondary ring-1 ring-brand ring-inset">
                <Icon name={icono} className="size-5" />
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id={titleId} className="text-display-xs font-semibold text-primary">
                  {title}
                </h2>
                {badge && <Badge tone="brand">{badge}</Badge>}
              </div>
              <p className="mt-1 text-sm text-tertiary">{description}</p>
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
        {children}
      </section>
    </div>
  )
}

export function AjustarStockDialog({
  open,
  producto,
  onClose,
  onAjustado,
}: {
  open: boolean
  producto: Producto
  onClose: () => void
  onAjustado: (producto: Producto, tipo: 'ENTRADA' | 'SALIDA', cantidad: number) => void
}) {
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTipo('ENTRADA')
      setCantidad('')
      setMotivo('')
      setError(null)
    }
  }, [open, producto.id])

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    const numero = Number(cantidad)
    if (!Number.isInteger(numero) || numero <= 0) {
      setError('La cantidad debe ser un número entero mayor a cero.')
      return
    }
    if (tipo === 'SALIDA' && numero > producto.stock) {
      setError(`Solo hay ${producto.stock} ${producto.unidad} disponibles.`)
      return
    }

    setGuardando(true)
    try {
      const resultado = await productosService.ajustarStock(producto.id, {
        tipo,
        cantidad: numero,
        motivo: motivo.trim() || undefined,
      })
      onAjustado(resultado.producto, tipo, numero)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ajustar el stock.')
    } finally {
      setGuardando(false)
    }
  }

  const numero = Number(cantidad)
  const cantidadValida = Number.isInteger(numero) && numero > 0
  const excedeStock = tipo === 'SALIDA' && cantidadValida && numero > producto.stock
  const stockProyectado = cantidadValida
    ? tipo === 'ENTRADA'
      ? producto.stock + numero
      : producto.stock - numero
    : producto.stock

  const movimientos = [
    {
      valor: 'ENTRADA' as const,
      etiqueta: 'Agregar stock',
      pista: 'Suma unidades al catálogo',
      icono: 'plus' as const,
    },
    {
      valor: 'SALIDA' as const,
      etiqueta: 'Quitar stock',
      pista: 'Resta unidades disponibles',
      icono: 'minus' as const,
    },
  ]

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      titleId="titulo-ajustar-stock"
      title="Ajustar stock"
      description={`${producto.codigo} · ${producto.descripcion}`}
      icono="package"
      badge="Inventario"
    >
      <form onSubmit={(evento) => void handleSubmit(evento)} noValidate className="flex flex-col gap-5">
        {error && (
          <Alert tone="error" title="Revisa el ajuste">
            {error}
          </Alert>
        )}

        <div role="group" aria-label="Tipo de movimiento" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {movimientos.map((opcion) => {
            const activo = tipo === opcion.valor
            return (
              <button
                key={opcion.valor}
                type="button"
                aria-pressed={activo}
                onClick={() => setTipo(opcion.valor)}
                className={cn(
                  'flex cursor-pointer flex-col items-start gap-1 rounded-xl p-3 text-left ring-1 ring-inset outline-focus-ring transition-colors',
                  activo ? 'bg-brand-primary ring-brand' : 'bg-primary ring-primary hover:bg-secondary',
                )}
              >
                <span className="flex w-full items-center gap-2">
                  <Icon name={opcion.icono} className="size-4 text-brand-secondary" />
                  <span className="flex-1 text-sm font-semibold text-primary">{opcion.etiqueta}</span>
                  {activo && <Icon name="check" className="size-4 text-brand-secondary" />}
                </span>
                <span className="text-xs text-tertiary">{opcion.pista}</span>
              </button>
            )
          })}
        </div>

        <div className="rounded-xl bg-secondary p-4 ring-1 ring-tertiary ring-inset">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-tertiary">Stock actual</p>
              <p className="text-xl font-semibold text-primary tabular-nums">
                {producto.stock} <span className="text-sm font-normal text-tertiary">{producto.unidad}</span>
              </p>
            </div>
            <Icon name="refresh" className="size-4 text-tertiary" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-tertiary pt-3">
            <p className="text-xs text-tertiary">Después del ajuste</p>
            <p
              className={cn(
                'text-sm font-semibold tabular-nums',
                excedeStock ? 'text-error-primary' : 'text-primary',
              )}
            >
              {excedeStock ? 'Cantidad mayor al stock' : `${stockProyectado} ${producto.unidad}`}
            </p>
          </div>
        </div>

        <TextField
          label="Cantidad"
          requiredMark
          type="number"
          value={cantidad}
          onChange={setCantidad}
          placeholder="0"
          inputClassName="text-md"
          hint={
            tipo === 'SALIDA'
              ? `Máximo disponible: ${producto.stock} ${producto.unidad}`
              : 'Número entero de unidades.'
          }
          autoFocus
        />
        <TextField
          label="Motivo (opcional)"
          value={motivo}
          onChange={setMotivo}
          placeholder="Ej. Compra, merma, corrección"
          maxLength={200}
          inputClassName="text-md"
        />

        <div className="flex flex-col-reverse gap-2 border-t border-tertiary pt-4 sm:flex-row sm:justify-end">
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
            startIcon={<Icon name={tipo === 'ENTRADA' ? 'plus' : 'minus'} className="size-4" />}
            className="w-full sm:w-auto"
          >
            {tipo === 'ENTRADA' ? 'Agregar stock' : 'Quitar stock'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

const ETIQUETA_TIPO: Record<MovimientoStock['tipo'], string> = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  VENTA: 'Venta',
}

const TONO_TIPO: Record<MovimientoStock['tipo'], 'success' | 'warning' | 'brand'> = {
  ENTRADA: 'success',
  SALIDA: 'warning',
  VENTA: 'brand',
}

const fecha = (iso: string) =>
  new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

export function MovimientosStockDialog({
  open,
  producto,
  onClose,
}: {
  open: boolean
  producto: Producto
  onClose: () => void
}) {
  const { data, error, loading, reload } = useAsyncData<MovimientoStock[]>(
    () => (open ? productosService.listarMovimientos(producto.id) : Promise.resolve([])),
    [open, producto.id],
  )

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      titleId="titulo-movimientos-stock"
      title="Movimientos de stock"
      description={`${producto.codigo} · ${producto.descripcion}`}
      icono="clipboard"
      badge="Historial"
    >
      <div className="flex items-center justify-between gap-2 border-t border-tertiary pt-4">
        <p className="text-sm text-secondary">Últimos 50 movimientos</p>
        <Button size="sm" variant="ghost" onClick={reload} isDisabled={loading}>
          <Icon name="refresh" className="size-4" />
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="error" title="No se pudo cargar el historial">
            {error.message}
          </Alert>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {loading ? (
          <MovimientosSkeleton />
        ) : (data ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-tertiary">
            Todavía no hay movimientos registrados.
          </p>
        ) : (
          (data ?? []).map((movimiento) => (
            <article key={movimiento.id} className="rounded-xl bg-secondary p-3 ring-1 ring-tertiary">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={TONO_TIPO[movimiento.tipo]}>{ETIQUETA_TIPO[movimiento.tipo]}</Badge>
                <span className="text-xs text-tertiary">{fecha(movimiento.creadoEn)}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-primary">
                {movimiento.cantidad} {producto.unidad} · {movimiento.stockAnterior} →{' '}
                {movimiento.stockPosterior}
              </p>
              {movimiento.motivo && (
                <p className="mt-1 text-xs text-secondary">{movimiento.motivo}</p>
              )}
              {(movimiento.usuario || movimiento.comprobante) && (
                <p className="mt-1 text-xs text-tertiary">
                  {[movimiento.usuario, movimiento.comprobante].filter(Boolean).join(' · ')}
                </p>
              )}
            </article>
          ))
        )}
      </div>

      <div className="mt-5 border-t border-tertiary pt-4">
        <Button variant="outline" onClick={onClose} className="w-full">
          Cerrar
        </Button>
      </div>
    </ModalShell>
  )
}
