import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/icons'
import { TextField } from '@/shared/ui/TextField'
import type { CdrInfo, ComprobanteDetalle } from '@/shared/types'
import { comprobantesService } from '../service/comprobantesService'

type Dialogo = 'anular' | 'nota-credito' | 'nota-debito' | 'cdr' | null

interface AccionesComprobanteProps {
  comprobante: ComprobanteDetalle
  onActualizado: () => void
}

const hoyEnLima = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

const mensajeError = (error: unknown) =>
  error instanceof Error ? error.message : 'No se pudo completar la operación.'

function Modal({
  tituloId,
  titulo,
  descripcion,
  onClose,
  children,
}: {
  tituloId: string
  titulo: string
  descripcion: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="no-print max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-primary p-5 shadow-xl ring-1 ring-tertiary ring-inset sm:rounded-2xl sm:p-6"
      >
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={tituloId} className="text-display-xs font-semibold text-primary">
              {titulo}
            </h2>
            <p className="mt-1 text-sm text-tertiary">{descripcion}</p>
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

export function AccionesComprobante({ comprobante, onActualizado }: AccionesComprobanteProps) {
  const navigate = useNavigate()
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [motivo, setMotivo] = useState('')
  const [motivoNota, setMotivoNota] = useState('')
  const [cantidades, setCantidades] = useState<Record<string, string>>({})
  const [cdr, setCdr] = useState<CdrInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)

  const sePuedeAnular = comprobante.estado === 'EMITIDO' || comprobante.estado === 'ACEPTADO'
  const sePuedeReenviar = comprobante.estado !== 'ANULADO'

  useEffect(() => {
    if (!dialogo) return
    const alEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && !procesando) setDialogo(null)
    }
    const desbordamiento = document.body.style.overflow
    document.addEventListener('keydown', alEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alEscape)
      document.body.style.overflow = desbordamiento
    }
  }, [dialogo, procesando])

  function abrir(tipo: Exclude<Dialogo, null>) {
    setError(null)
    setMotivo('')
    setMotivoNota('')
    setCdr(null)
    setCantidades(Object.fromEntries(comprobante.items.map((item) => [item.id, '1'])))
    setDialogo(tipo)
  }

  function cerrar() {
    if (procesando) return
    setDialogo(null)
  }

  async function anular(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (motivo.trim().length < 5) {
      setError('Escribe el motivo de la anulación (al menos 5 caracteres).')
      return
    }
    setProcesando(true)
    setError(null)
    try {
      await comprobantesService.anular(comprobante.id, motivo)
      setDialogo(null)
      onActualizado()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setProcesando(false)
    }
  }

  async function consultarCdr() {
    setProcesando(true)
    setError(null)
    try {
      setCdr(await comprobantesService.consultarCdr(comprobante.id))
      setDialogo('cdr')
    } catch (err) {
      setError(mensajeError(err))
      setDialogo('cdr')
    } finally {
      setProcesando(false)
    }
  }

  async function reenviar() {
    setProcesando(true)
    setError(null)
    try {
      await comprobantesService.reenviar(comprobante.id)
      onActualizado()
    } catch (err) {
      setError(mensajeError(err))
      abrir('cdr')
    } finally {
      setProcesando(false)
    }
  }

  async function emitirNota(
    tipo: 'NOTA_CREDITO' | 'NOTA_DEBITO',
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault()
    if (motivoNota.trim().length < 5) {
      setError('Escribe el motivo de la nota (al menos 5 caracteres).')
      return
    }
    const items = comprobante.items.flatMap((item) => {
      const productoId = item.productoId
      const cantidad = Number(cantidades[item.id] ?? '0')
      if (!productoId || !Number.isFinite(cantidad) || cantidad <= 0) return []
      return [{ productoId, cantidad }]
    })
    if (!items.length) {
      setError('Indica una cantidad mayor a cero en al menos un producto.')
      return
    }

    setProcesando(true)
    setError(null)
    try {
      const nota = await comprobantesService.crear({
        tipo,
        clienteId: comprobante.clienteId,
        fecha: hoyEnLima(),
        comprobanteAfectadoId: comprobante.id,
        motivoNota: motivoNota.trim(),
        items,
      })
      setDialogo(null)
      navigate(`/comprobantes/${nota.id}`)
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setProcesando(false)
    }
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader
          title="Gestión del comprobante"
          description="Anulación, reenvío y consulta del estado registrado. Las acciones SUNAT son locales."
          density="compact"
        />
        <div className="flex flex-wrap gap-2 border-t border-tertiary p-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void consultarCdr()}
            startIcon={<Icon name="file-text" className="size-4" />}
            isDisabled={procesando}
          >
            Consultar CDR
          </Button>
          {sePuedeReenviar && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void reenviar()}
              startIcon={<Icon name="refresh" className="size-4" />}
              isDisabled={procesando}
            >
              Reenviar
            </Button>
          )}
          {sePuedeAnular && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => abrir('nota-credito')}
                startIcon={<Icon name="arrow-down" className="size-4" />}
                isDisabled={procesando}
              >
                Nota de crédito
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => abrir('nota-debito')}
                startIcon={<Icon name="arrow-up" className="size-4" />}
                isDisabled={procesando}
              >
                Nota de débito
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => abrir('anular')}
                startIcon={<Icon name="trash" className="size-4" />}
                isDisabled={procesando}
              >
                Anular
              </Button>
            </>
          )}
          {comprobante.estado === 'ANULADO' && comprobante.motivoAnulacion && (
            <p className="w-full text-sm text-error-primary">
              Anulado: {comprobante.motivoAnulacion}
            </p>
          )}
        </div>
      </Card>

      {dialogo === 'anular' && (
        <Modal
          tituloId="titulo-anular"
          titulo="Anular comprobante"
          descripcion="La anulación queda registrada localmente; no se envía una baja a SUNAT."
          onClose={cerrar}
        >
          <form onSubmit={(evento) => void anular(evento)} className="flex flex-col gap-4">
            {error && <Alert tone="error" title="No se pudo anular">{error}</Alert>}
            <label className="flex flex-col gap-1.5 text-sm font-medium text-secondary">
              Motivo de la anulación
              <textarea
                value={motivo}
                onChange={(evento) => setMotivo(evento.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Ej. El cliente solicitó la anulación"
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2.5 text-md text-primary shadow-xs placeholder:text-placeholder focus:ring-2 focus:ring-brand focus:outline-none"
              />
            </label>
            <div className="flex flex-col-reverse gap-2 border-t border-tertiary pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={cerrar} isDisabled={procesando} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" variant="danger" isLoading={procesando} className="w-full sm:w-auto">
                Anular comprobante
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {(dialogo === 'nota-credito' || dialogo === 'nota-debito') && (
        <Modal
          tituloId="titulo-nota"
          titulo={dialogo === 'nota-credito' ? 'Nueva nota de crédito' : 'Nueva nota de débito'}
          descripcion={`Afecta a ${comprobante.serie}-${String(comprobante.numero).padStart(8, '0')}. Ajusta las cantidades a devolver o cargar.`}
          onClose={cerrar}
        >
          <form
            onSubmit={(evento) =>
              void emitirNota(dialogo === 'nota-credito' ? 'NOTA_CREDITO' : 'NOTA_DEBITO', evento)
            }
            className="flex flex-col gap-4"
          >
            {error && <Alert tone="error" title="No se pudo emitir la nota">{error}</Alert>}
            <label className="flex flex-col gap-1.5 text-sm font-medium text-secondary">
              Motivo de la nota
              <textarea
                value={motivoNota}
                onChange={(evento) => setMotivoNota(evento.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Ej. Devolución de producto"
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2.5 text-md text-primary shadow-xs placeholder:text-placeholder focus:ring-2 focus:ring-brand focus:outline-none"
              />
            </label>
            <div className="flex flex-col gap-2">
              {comprobante.items.map((item) => (
                <TextField
                  key={item.id}
                  label={`Cantidad · ${item.descripcion}`}
                  type="number"
                  value={cantidades[item.id] ?? '1'}
                  onChange={(valor) => setCantidades((actuales) => ({ ...actuales, [item.id]: valor }))}
                  inputClassName="text-md"
                />
              ))}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-tertiary pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={cerrar} isDisabled={procesando} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" isLoading={procesando} className="w-full sm:w-auto">
                Emitir nota
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {dialogo === 'cdr' && (
        <Modal
          tituloId="titulo-cdr"
          titulo="Estado del comprobante"
          descripcion="Consulta del estado registrado; en modo local no se contacta a SUNAT."
          onClose={cerrar}
        >
          {error && (
            <div className="mb-4">
              <Alert tone="error" title="No se pudo consultar">{error}</Alert>
            </div>
          )}
          {cdr && (
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {[
                ['Comprobante', cdr.comprobante],
                ['Estado', cdr.estado],
                ['Código', cdr.codigo ?? '—'],
                ['Proveedor', cdr.proveedor],
                ['Ticket', cdr.ticket ?? '—'],
                ['CDR / UUID', cdr.cdr ?? '—'],
              ].map(([etiqueta, valor]) => (
                <div key={etiqueta} className="min-w-0 rounded-lg bg-secondary_alt p-3">
                  <dt className="text-xs text-tertiary">{etiqueta}</dt>
                  <dd className="mt-0.5 break-words font-medium text-primary">{valor}</dd>
                </div>
              ))}
            </dl>
          )}
          {cdr?.mensaje && <p className="mt-4 text-sm text-secondary">{cdr.mensaje}</p>}
          <div className="mt-5 flex justify-end border-t border-tertiary pt-4">
            <Button variant="outline" onClick={cerrar} className="w-full sm:w-auto">
              Cerrar
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
