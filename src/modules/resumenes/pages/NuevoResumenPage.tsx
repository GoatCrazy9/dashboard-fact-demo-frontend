import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { cn } from '@/shared/utils/cn'
import { hoyEnLima } from '@/shared/utils/fechas'
import { fechaCorta, numeroComprobante, soles } from '@/shared/utils/format'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Campo, FormSection, inputClass } from '@/shared/ui/FormSection'
import { Icon } from '@/shared/ui/icons'
import { comprobantesService } from '@/modules/comprobantes/service/comprobantesService'
import type { TipoResumenSunat } from '@/shared/types'
import {
  ETIQUETAS_TIPO,
  ResumenFormSkeleton,
} from '../components/resumenUi'
import { resumenesService } from '../service/resumenesService'
import { esBajable, esResumible } from '../utils'

export function NuevoResumenPage() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const tipo: TipoResumenSunat =
    parametros.get('tipo') === 'COMUNICACION_BAJA'
      ? 'COMUNICACION_BAJA'
      : 'RESUMEN_DIARIO'

  const { data, error, loading } = useAsyncData(comprobantesService.listar, [])
  const { data: configuracion } = useAsyncData(resumenesService.configuracion, [])
  const comprobantes = data ?? []
  const envioReal = configuracion?.envioReal ?? false

  const [fecha, setFecha] = useState(hoyEnLima)
  const [observacion, setObservacion] = useState('')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [guardando, setGuardando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  const resumibles = useMemo(
    () =>
      comprobantes.filter(
        (comprobante) =>
          comprobante.fecha.slice(0, 10) === fecha && esResumible(comprobante),
      ),
    [comprobantes, fecha],
  )

  const bajables = useMemo(
    () =>
      comprobantes.filter(
        (comprobante) =>
          esBajable(comprobante) &&
          (!comprobante.anuladoEn || comprobante.anuladoEn.slice(0, 10) <= fecha),
      ),
    [comprobantes, fecha],
  )

  const seleccionadosVisibles = bajables.filter((comprobante) =>
    seleccionados.has(comprobante.id),
  )
  const total =
    tipo === 'RESUMEN_DIARIO'
      ? resumibles.reduce((suma, comprobante) => suma + comprobante.total, 0)
      : seleccionadosVisibles.reduce((suma, comprobante) => suma + comprobante.total, 0)

  function alternar(id: string) {
    setSeleccionados((anterior) => {
      const siguiente = new Set(anterior)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)
      return siguiente
    })
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErrorEnvio(null)

    if (tipo === 'COMUNICACION_BAJA' && seleccionados.size === 0) {
      setErrorEnvio('Selecciona al menos un comprobante anulado.')
      return
    }

    setGuardando(true)
    try {
      const creado =
        tipo === 'RESUMEN_DIARIO'
          ? await resumenesService.crearDiario({ fecha, observacion })
          : await resumenesService.crearBaja({
              fecha,
              comprobanteIds: [...seleccionados],
              observacion,
            })
      navigate(`/resumenes/${creado.id}`)
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'No se pudo guardar el resumen.')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <ResumenFormSkeleton />

  return (
    <div className="flex flex-col">
      <div className="mb-8 flex w-full flex-col gap-5 px-4 lg:px-8">
        {error && (
          <Alert tone="error" title="No se pudieron cargar los comprobantes">
            {error.message}
          </Alert>
        )}

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="text-xl font-semibold text-primary">
              Nuevo: {ETIQUETAS_TIPO[tipo].toLowerCase()}
            </p>
            <p className="text-md text-tertiary">
              {envioReal
                ? 'El servidor firma, envía y consulta la constancia con el proveedor directo configurado.'
                : 'El registro queda en modo local, sin credenciales SOL ni envío a SUNAT.'}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              onPress={() => navigate('/resumenes')}
              startIcon={<Icon name="arrow-left" className="size-4" />}
            >
              Volver al listado
            </Button>
          </div>
        </div>

        <div className="flex w-full flex-col" data-orientation="horizontal">
          <div
            role="tablist"
            aria-label="Tipo de resumen"
            className="flex flex-wrap gap-x-3 gap-y-2 border-b border-border-secondary pb-2.5"
          >
            {(['RESUMEN_DIARIO', 'COMUNICACION_BAJA'] as const).map((valor) => {
              const activo = tipo === valor
              return (
                <button
                  key={valor}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => navigate(`/resumenes/nuevo?tipo=${valor}`)}
                  className={cn(
                    'z-10 flex h-max shrink-0 cursor-pointer items-center justify-center rounded-none border-b-2 px-0.5 pt-0 pb-2.5 text-sm font-semibold whitespace-nowrap outline-focus-ring transition duration-100 ease-linear',
                    activo
                      ? 'border-fg-brand-primary_alt text-brand-secondary'
                      : 'border-transparent text-quaternary hover:text-secondary',
                  )}
                >
                  {ETIQUETAS_TIPO[valor]}
                </button>
              )
            })}
          </div>
        </div>

        <Alert
          tone={envioReal ? 'info' : 'warning'}
          title={
            envioReal
              ? `Envío directo a SUNAT · ${configuracion?.modo === 'produccion' ? 'producción' : 'beta'}`
              : 'Modo local'
          }
        >
          {envioReal
            ? 'Se genera el XML UBL, se firma y se envía con sendSummary; el ticket se consulta con getStatus hasta obtener el CDR.'
            : 'Se genera la constancia local. No se consultan credenciales SOL ni se envían archivos a SUNAT.'}
        </Alert>
      </div>

      <form onSubmit={enviar} className="flex w-full flex-col gap-6 px-4 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 space-y-4 lg:col-span-2">
            <FormSection
              titulo="Datos del resumen"
              descripcion="Fecha de referencia y detalle opcional del envío."
              icono="calendar"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  etiqueta={
                    tipo === 'RESUMEN_DIARIO'
                      ? 'Fecha del resumen'
                      : 'Fecha de la comunicación'
                  }
                >
                  <input
                    type="date"
                    value={fecha}
                    onChange={(evento) => {
                      setFecha(evento.target.value)
                      setSeleccionados(new Set())
                    }}
                    className={inputClass}
                    required
                  />
                </Campo>
                <Campo etiqueta="Observación" className="sm:col-span-2" pista="Máximo 500 caracteres.">
                  <textarea
                    value={observacion}
                    onChange={(evento) => setObservacion(evento.target.value)}
                    className={cn(inputClass, 'h-auto resize-y py-2.5')}
                    rows={3}
                    maxLength={500}
                    placeholder="Detalle opcional del resumen o la baja"
                  />
                </Campo>
              </div>
            </FormSection>

            <FormSection
              titulo={
                tipo === 'RESUMEN_DIARIO'
                  ? 'Comprobantes del día'
                  : 'Comprobantes anulados'
              }
              descripcion={
                tipo === 'RESUMEN_DIARIO'
                  ? 'Boletas y notas sobre boleta que aún no tienen resumen.'
                  : 'Selecciona los comprobantes que se comunicarán como de baja.'
              }
              icono="receipt"
            >
              {loading && <p className="text-sm text-tertiary">Cargando comprobantes…</p>}

              {!loading &&
                (tipo === 'RESUMEN_DIARIO' ? resumibles : bajables).length === 0 && (
                  <p className="text-sm text-tertiary">
                    {tipo === 'RESUMEN_DIARIO'
                      ? 'No hay comprobantes resumibles para esa fecha.'
                      : 'No hay comprobantes anulados disponibles para esa fecha.'}
                  </p>
                )}

              <div className="space-y-2">
                {(tipo === 'RESUMEN_DIARIO' ? resumibles : bajables).map((comprobante) => (
                  <label
                    key={comprobante.id}
                    className="flex min-w-0 items-start gap-3 rounded-lg border border-tertiary p-3 text-sm"
                  >
                    {tipo === 'COMUNICACION_BAJA' && (
                      <input
                        type="checkbox"
                        checked={seleccionados.has(comprobante.id)}
                        onChange={() => alternar(comprobante.id)}
                        className="mt-0.5 size-4 shrink-0 accent-brand-solid"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-primary">
                        {comprobante.tipo} {numeroComprobante(comprobante.serie, comprobante.numero)}
                      </span>
                      <span className="block truncate text-xs text-tertiary">
                        {comprobante.cliente} · {comprobante.clienteDocumento}
                      </span>
                      <span className="block text-xs text-tertiary">
                        {fechaCorta(comprobante.fecha)} · {soles(comprobante.total)}
                      </span>
                      {comprobante.motivoAnulacion && (
                        <span className="block text-xs text-tertiary">
                          Motivo: {comprobante.motivoAnulacion}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </FormSection>
          </div>

          <div className="min-w-0">
            <Card className="lg:sticky lg:top-20">
              <div className="border-b border-secondary px-4 py-4 lg:px-6">
                <h2 className="text-md font-semibold text-primary">Resumen</h2>
              </div>
              <div className="space-y-3 p-4 lg:p-6">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-tertiary">Comprobantes</span>
                  <span className="text-secondary tabular-nums">
                    {tipo === 'RESUMEN_DIARIO' ? resumibles.length : seleccionados.size}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-base font-semibold">
                  <span className="text-primary">Total</span>
                  <span className="text-primary tabular-nums">{soles(total)}</span>
                </div>
                {errorEnvio && <Alert tone="error">{errorEnvio}</Alert>}
                <Button
                  type="submit"
                  fullWidth
                  isLoading={guardando}
                  startIcon={<Icon name="send" className="size-4" />}
                >
                  {tipo === 'RESUMEN_DIARIO' ? 'Generar resumen' : 'Registrar baja'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
